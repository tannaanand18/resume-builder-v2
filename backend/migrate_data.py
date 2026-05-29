import os

import pymysql


LOCAL_HOST = os.getenv("LOCAL_DB_HOST", "127.0.0.1")
LOCAL_PORT = int(os.getenv("LOCAL_DB_PORT", "3306"))
LOCAL_USER = os.getenv("LOCAL_DB_USER", "root")
LOCAL_PASSWORD = os.getenv("LOCAL_DB_PASSWORD", "")
LOCAL_DB = os.getenv("LOCAL_DB_NAME", "resume_db")

REMOTE_HOST = os.getenv("REMOTE_DB_HOST", "")
REMOTE_PORT = int(os.getenv("REMOTE_DB_PORT", "3306"))
REMOTE_USER = os.getenv("REMOTE_DB_USER", "")
REMOTE_PASSWORD = os.getenv("REMOTE_DB_PASSWORD", "")
REMOTE_DB = os.getenv("REMOTE_DB_NAME", "")


def require_env():
    missing = [
        name
        for name, value in {
            "LOCAL_DB_PASSWORD": LOCAL_PASSWORD,
            "REMOTE_DB_HOST": REMOTE_HOST,
            "REMOTE_DB_USER": REMOTE_USER,
            "REMOTE_DB_PASSWORD": REMOTE_PASSWORD,
            "REMOTE_DB_NAME": REMOTE_DB,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError("Missing environment variables: " + ", ".join(missing))


def main():
    require_env()

    local = pymysql.connect(
        host=LOCAL_HOST,
        port=LOCAL_PORT,
        user=LOCAL_USER,
        password=LOCAL_PASSWORD,
        database=LOCAL_DB,
    )
    remote = pymysql.connect(
        host=REMOTE_HOST,
        port=REMOTE_PORT,
        user=REMOTE_USER,
        password=REMOTE_PASSWORD,
        database=REMOTE_DB,
    )

    local_cur = local.cursor()
    remote_cur = remote.cursor()
    tables = ["users", "resumes", "education", "experience", "skills", "projects", "certifications"]

    for table in tables:
        local_cur.execute("SHOW COLUMNS FROM " + table)
        local_cols = {col[0]: col for col in local_cur.fetchall()}
        remote_cur.execute("SHOW COLUMNS FROM " + table)
        remote_cols = {col[0] for col in remote_cur.fetchall()}

        for col_name, col_info in local_cols.items():
            if col_name not in remote_cols:
                col_type = col_info[1]
                nullable = "NULL" if col_info[2] == "YES" else "NOT NULL"
                default = ""
                if col_info[4] is not None:
                    default = " DEFAULT '" + str(col_info[4]) + "'"
                alter_sql = "ALTER TABLE " + table + " ADD COLUMN " + col_name + " " + col_type + " " + nullable + default
                print("Adding column: " + table + "." + col_name)
                remote_cur.execute(alter_sql)
                remote.commit()

    remote_cur.execute("SELECT id, email FROM users")
    existing = remote_cur.fetchall()
    existing_emails = {row[1] for row in existing}
    email_to_remote_id = {row[1]: row[0] for row in existing}
    print("Existing users in remote database: " + str(len(existing_emails)))

    local_cur.execute("SHOW COLUMNS FROM users")
    user_cols = [col[0] for col in local_cur.fetchall()]
    remote_cur.execute("SHOW COLUMNS FROM users")
    remote_user_cols = {col[0] for col in remote_cur.fetchall()}
    common_user_cols = [col for col in user_cols if col in remote_user_cols]
    email_idx = common_user_cols.index("email")
    id_idx = common_user_cols.index("id")

    insert_cols = [col for col in common_user_cols if col != "id"]
    insert_col_list = ", ".join(insert_cols)
    insert_placeholders = ", ".join(["%s"] * len(insert_cols))

    local_cur.execute("SELECT " + ", ".join(common_user_cols) + " FROM users")
    local_users = local_cur.fetchall()
    user_id_map = {}
    new_users = 0

    for row in local_users:
        old_id = row[id_idx]
        email = row[email_idx]
        if email in existing_emails:
            user_id_map[old_id] = email_to_remote_id[email]
        else:
            values = [row[common_user_cols.index(col)] for col in insert_cols]
            sql = "INSERT INTO users (" + insert_col_list + ") VALUES (" + insert_placeholders + ")"
            remote_cur.execute(sql, values)
            user_id_map[old_id] = remote_cur.lastrowid
            new_users += 1

    remote.commit()
    print("users: " + str(new_users) + " new rows added")

    resume_id_map = {}
    local_cur.execute("SHOW COLUMNS FROM resumes")
    local_res_cols = [col[0] for col in local_cur.fetchall()]
    remote_cur.execute("SHOW COLUMNS FROM resumes")
    remote_res_cols = {col[0] for col in remote_cur.fetchall()}
    common_res_cols = [col for col in local_res_cols if col in remote_res_cols]

    insert_res_cols = [col for col in common_res_cols if col != "id"]
    insert_res_list = ", ".join(insert_res_cols)
    insert_res_ph = ", ".join(["%s"] * len(insert_res_cols))

    local_cur.execute("SELECT " + ", ".join(common_res_cols) + " FROM resumes")
    local_resumes = local_cur.fetchall()
    res_id_idx = common_res_cols.index("id")
    res_uid_idx = insert_res_cols.index("user_id") if "user_id" in insert_res_cols else None

    new_resumes = 0
    for row in local_resumes:
        old_res_id = row[res_id_idx]
        values = [row[common_res_cols.index(col)] for col in insert_res_cols]
        if res_uid_idx is not None:
            old_uid = values[res_uid_idx]
            values[res_uid_idx] = user_id_map.get(old_uid, old_uid)
        sql = "INSERT INTO resumes (" + insert_res_list + ") VALUES (" + insert_res_ph + ")"
        try:
            remote_cur.execute(sql, values)
            resume_id_map[old_res_id] = remote_cur.lastrowid
            new_resumes += 1
        except Exception as e:
            print("Skipped resume: " + str(e))

    remote.commit()
    print("resumes: " + str(new_resumes) + " new rows added")

    for table in ["education", "experience", "skills", "projects", "certifications"]:
        local_cur.execute("SHOW COLUMNS FROM " + table)
        local_columns = [col[0] for col in local_cur.fetchall()]
        remote_cur.execute("SHOW COLUMNS FROM " + table)
        remote_columns = {col[0] for col in remote_cur.fetchall()}
        common_cols = [col for col in local_columns if col in remote_columns]

        insert_cols = [col for col in common_cols if col != "id"]
        insert_list = ", ".join(insert_cols)
        insert_ph = ", ".join(["%s"] * len(insert_cols))

        local_cur.execute("SELECT " + ", ".join(common_cols) + " FROM " + table)
        rows = local_cur.fetchall()
        rid_idx = insert_cols.index("resume_id") if "resume_id" in insert_cols else None

        count = 0
        for row in rows:
            values = [row[common_cols.index(col)] for col in insert_cols]
            if rid_idx is not None:
                old_rid = values[rid_idx]
                if old_rid in resume_id_map:
                    values[rid_idx] = resume_id_map[old_rid]
                else:
                    continue
            sql = "INSERT INTO " + table + " (" + insert_list + ") VALUES (" + insert_ph + ")"
            try:
                remote_cur.execute(sql, values)
                count += 1
            except Exception as e:
                print("Skipped row in " + table + ": " + str(e))
        remote.commit()
        print(table + ": " + str(count) + " new rows added")

    print("Migration complete")
    local.close()
    remote.close()


if __name__ == "__main__":
    main()

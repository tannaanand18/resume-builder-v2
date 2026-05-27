import pymysql

# =====================================================
# CHANGE THESE TO YOUR LOCAL DATABASE CREDENTIALS
# =====================================================
LOCAL_HOST = '127.0.0.1'
LOCAL_PORT = 3306
LOCAL_USER = 'root'
LOCAL_PASSWORD = 'Smit1911'
LOCAL_DB = 'resume_db'

# Railway database (DO NOT CHANGE)
RAILWAY_HOST = 'yamanote.proxy.rlwy.net'
RAILWAY_PORT = 24292
RAILWAY_USER = 'root'
RAILWAY_PASSWORD = 'iitPaPIcYhXFKusvTeJMJwkOZOvavNop'
RAILWAY_DB = 'railway'

local = pymysql.connect(host=LOCAL_HOST, port=LOCAL_PORT, user=LOCAL_USER, password=LOCAL_PASSWORD, database=LOCAL_DB)
railway = pymysql.connect(host=RAILWAY_HOST, port=RAILWAY_PORT, user=RAILWAY_USER, password=RAILWAY_PASSWORD, database=RAILWAY_DB)

local_cur = local.cursor()
rail_cur = railway.cursor()

tables = ['users', 'resumes', 'education', 'experience', 'skills', 'projects', 'certifications']

# Step 1: Sync missing columns
for table in tables:
    local_cur.execute('SHOW COLUMNS FROM ' + table)
    local_cols = {col[0]: col for col in local_cur.fetchall()}
    rail_cur.execute('SHOW COLUMNS FROM ' + table)
    rail_cols = {col[0] for col in rail_cur.fetchall()}

    for col_name, col_info in local_cols.items():
        if col_name not in rail_cols:
            col_type = col_info[1]
            nullable = 'NULL' if col_info[2] == 'YES' else 'NOT NULL'
            default = ''
            if col_info[4] is not None:
                default = " DEFAULT '" + str(col_info[4]) + "'"
            alter_sql = 'ALTER TABLE ' + table + ' ADD COLUMN ' + col_name + ' ' + col_type + ' ' + nullable + default
            print('Adding column: ' + table + '.' + col_name)
            rail_cur.execute(alter_sql)
            railway.commit()

# Step 2: Get existing emails in Railway to skip duplicate users
rail_cur.execute('SELECT id, email FROM users')
existing = rail_cur.fetchall()
existing_emails = {row[1] for row in existing}
print('Existing users in Railway: ' + str(len(existing_emails)))

# Build email-to-railway-id map for existing users
rail_cur.execute('SELECT id, email FROM users')
email_to_rail_id = {row[1]: row[0] for row in rail_cur.fetchall()}

# Step 3: Migrate users (skip duplicates by email, let Railway auto-assign new IDs)
local_cur.execute('SHOW COLUMNS FROM users')
user_cols = [col[0] for col in local_cur.fetchall()]
rail_cur.execute('SHOW COLUMNS FROM users')
rail_user_cols = {col[0] for col in rail_cur.fetchall()}
common_user_cols = [c for c in user_cols if c in rail_user_cols]
email_idx = common_user_cols.index('email')
id_idx = common_user_cols.index('id')

# Columns WITHOUT 'id' for insert (let auto-increment handle it)
insert_cols = [c for c in common_user_cols if c != 'id']
insert_col_list = ', '.join(insert_cols)
insert_placeholders = ', '.join(['%s'] * len(insert_cols))

local_cur.execute('SELECT ' + ', '.join(common_user_cols) + ' FROM users')
local_users = local_cur.fetchall()

# Map: old local user id -> new Railway user id
user_id_map = {}
new_users = 0

for row in local_users:
    old_id = row[id_idx]
    email = row[email_idx]
    if email in existing_emails:
        # User already exists, map old id to existing Railway id
        user_id_map[old_id] = email_to_rail_id[email]
    else:
        # Insert without id, let auto-increment assign new id
        values = [row[common_user_cols.index(c)] for c in insert_cols]
        sql = 'INSERT INTO users (' + insert_col_list + ') VALUES (' + insert_placeholders + ')'
        rail_cur.execute(sql, values)
        new_rail_id = rail_cur.lastrowid
        user_id_map[old_id] = new_rail_id
        new_users += 1

railway.commit()
print('users: ' + str(new_users) + ' new rows added')

# Step 4: Migrate resumes (remap user_id, let id auto-increment)
resume_id_map = {}
local_cur.execute('SHOW COLUMNS FROM resumes')
local_res_cols = [col[0] for col in local_cur.fetchall()]
rail_cur.execute('SHOW COLUMNS FROM resumes')
rail_res_cols = {col[0] for col in rail_cur.fetchall()}
common_res_cols = [c for c in local_res_cols if c in rail_res_cols]

insert_res_cols = [c for c in common_res_cols if c != 'id']
insert_res_list = ', '.join(insert_res_cols)
insert_res_ph = ', '.join(['%s'] * len(insert_res_cols))

# Get existing resume IDs to avoid re-inserting
rail_cur.execute('SELECT id FROM resumes')
existing_resume_ids = {row[0] for row in rail_cur.fetchall()}

local_cur.execute('SELECT ' + ', '.join(common_res_cols) + ' FROM resumes')
local_resumes = local_cur.fetchall()
res_id_idx = common_res_cols.index('id')
res_uid_idx_in_insert = insert_res_cols.index('user_id') if 'user_id' in insert_res_cols else None

new_resumes = 0
for row in local_resumes:
    old_res_id = row[res_id_idx]
    values = [row[common_res_cols.index(c)] for c in insert_res_cols]
    # Remap user_id
    if res_uid_idx_in_insert is not None:
        old_uid = values[res_uid_idx_in_insert]
        values[res_uid_idx_in_insert] = user_id_map.get(old_uid, old_uid)
    sql = 'INSERT INTO resumes (' + insert_res_list + ') VALUES (' + insert_res_ph + ')'
    try:
        rail_cur.execute(sql, values)
        new_rail_res_id = rail_cur.lastrowid
        resume_id_map[old_res_id] = new_rail_res_id
        new_resumes += 1
    except Exception as e:
        print('  Skipped resume: ' + str(e))

railway.commit()
print('resumes: ' + str(new_resumes) + ' new rows added')

# Step 5: Migrate child tables (remap resume_id, let id auto-increment)
for table in ['education', 'experience', 'skills', 'projects', 'certifications']:
    local_cur.execute('SHOW COLUMNS FROM ' + table)
    local_columns = [col[0] for col in local_cur.fetchall()]
    rail_cur.execute('SHOW COLUMNS FROM ' + table)
    rail_columns = {col[0] for col in rail_cur.fetchall()}
    common_cols = [c for c in local_columns if c in rail_columns]

    insert_cols = [c for c in common_cols if c != 'id']
    insert_list = ', '.join(insert_cols)
    insert_ph = ', '.join(['%s'] * len(insert_cols))

    local_cur.execute('SELECT ' + ', '.join(common_cols) + ' FROM ' + table)
    rows = local_cur.fetchall()

    rid_idx_in_insert = insert_cols.index('resume_id') if 'resume_id' in insert_cols else None

    count = 0
    for row in rows:
        values = [row[common_cols.index(c)] for c in insert_cols]
        # Remap resume_id
        if rid_idx_in_insert is not None:
            old_rid = values[rid_idx_in_insert]
            if old_rid in resume_id_map:
                values[rid_idx_in_insert] = resume_id_map[old_rid]
            # If resume not mapped, skip this row
            else:
                continue
        sql = 'INSERT INTO ' + table + ' (' + insert_list + ') VALUES (' + insert_ph + ')'
        try:
            rail_cur.execute(sql, values)
            count += 1
        except Exception as e:
            print('  Skipped row in ' + table + ': ' + str(e))
    railway.commit()
    print(table + ': ' + str(count) + ' new rows added')

print()
print('Migration complete!')

local.close()
railway.close()
-- ─────────────────────────────────────────────────────────────
-- MIGRATION 002: Add is_system flag + seed data-model from Excel
-- ─────────────────────────────────────────────────────────────

-- Add is_system to modules (marks seeded/Excel modules vs designer-created ones)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Add placeholder to fields (was missing from original schema)
ALTER TABLE fields ADD COLUMN IF NOT EXISTS placeholder VARCHAR(200);

-- ─────────────────────────────────────────────────────────────
-- SYSTEM MODULES (from data_model_inspect.txt / UniERP Excel)
-- ─────────────────────────────────────────────────────────────
INSERT INTO modules (module_id, module_key, module_name, description, is_active, is_system) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'inquiry_master',           'Student Inquiry',           'Student initial inquiry / lead capture form',                true, true),
  ('a0000000-0000-0000-0000-000000000002', 'course_master',            'Courses',                   'Course catalogue',                                           true, true),
  ('a0000000-0000-0000-0000-000000000003', 'streams_master',           'Streams',                   'Stream definitions under a course',                          true, true),
  ('a0000000-0000-0000-0000-000000000004', 'subject_master',           'Subjects',                  'Subject catalogue',                                          true, true),
  ('a0000000-0000-0000-0000-000000000005', 'stream_subject',           'Stream–Subject Map',        'Subjects mapped to streams',                                 true, true),
  ('a0000000-0000-0000-0000-000000000006', 'counsellor_master',        'Counsellors',               'Counsellor master data',                                     true, true),
  ('a0000000-0000-0000-0000-000000000007', 'counsellor_arrangement',   'Counsellor Arrangements',   'Counsellor-stream fee arrangements',                         true, true),
  ('a0000000-0000-0000-0000-000000000008', 'institute_master',         'Institutes',                'Institute master data',                                      true, true),
  ('a0000000-0000-0000-0000-000000000009', 'inst_offerings',           'Institute Offerings',       'Streams offered by each institute',                          true, true),
  ('a0000000-0000-0000-0000-000000000010', 'prof_master',              'Professors',                'Professor / faculty master',                                  true, true),
  ('a0000000-0000-0000-0000-000000000011', 'prof_subject_master',      'Professor Subjects',        'Professor–subject assignments',                              true, true),
  ('a0000000-0000-0000-0000-000000000012', 'fee_master',               'Fee Master',                'Semester-wise fee structure per institute+stream',            true, true),
  ('a0000000-0000-0000-0000-000000000013', 'hostel_master',            'Hostel Master',             'Hostel master data',                                         true, true),
  ('a0000000-0000-0000-0000-000000000014', 'hostel_rooms',             'Hostel Rooms',              'Hostel room categories and charges',                         true, true),
  ('a0000000-0000-0000-0000-000000000015', 'transport_master',         'Transport Routes',          'Transport route master with charges',                        true, true),
  ('a0000000-0000-0000-0000-000000000016', 'institute_resources',      'Institute Resources',       'Labs, lecture halls, libraries, auditoriums etc.',           true, true),
  ('a0000000-0000-0000-0000-000000000017', 'inquiry_details',          'Inquiry Details',           'Extended inquiry — stream / counsellor / location prefs',   true, true),
  ('a0000000-0000-0000-0000-000000000018', 'registration_fee',         'Registration Fee',          'Registration fee schedule per institute+stream',             true, true),
  ('a0000000-0000-0000-0000-000000000019', 'registration',             'Registration',              'Student registration form data',                             true, true),
  ('a0000000-0000-0000-0000-000000000020', 'enrollment_master',        'Enrollment',                'Student enrollment records',                                 true, true),
  ('a0000000-0000-0000-0000-000000000021', 'hostel_allotment',         'Hostel Allotment',          'Hostel room allotments per enrollment',                      true, true),
  ('a0000000-0000-0000-0000-000000000022', 'transport_allotment',      'Transport Allotment',       'Transport route allotments per enrollment',                  true, true)
ON CONFLICT (module_key) DO UPDATE SET is_system = TRUE, module_name = EXCLUDED.module_name, description = EXCLUDED.description;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — inquiry_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'inquiry_id',           'bigint',      false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000001', 'inq_fname',            'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'inq_mname',            'varchar',     true,  false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'inq_lname',            'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'legal_guardian_name',  'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'related_person_name',  'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'relation',             'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'mobile_no',            'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'dob',                  'date',        false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'class_10_percent',     'numeric',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'class_12_percent',     'numeric',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'nationality',          'varchar',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'created_at',           'timestamp',   true,  false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — course_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'course_id',    'integer',  false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000002', 'course_name',  'varchar',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000002', 'start_date',   'date',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000002', 'end_date',     'date',     true,  false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — streams_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, db_length, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'stream_id',       'integer',  null, false, true,  true,  true,  null,                                           null),
  ('a0000000-0000-0000-0000-000000000003', 'course_id',       'integer',  null, false, false, false, false, 'a0000000-0000-0000-0000-000000000002',         'course_id'),
  ('a0000000-0000-0000-0000-000000000003', 'stream_name',     'varchar',  30,   false, false, false, false, null,                                           null),
  ('a0000000-0000-0000-0000-000000000003', 'stream_format',   'varchar',  10,   false, false, false, false, null,                                           null),
  ('a0000000-0000-0000-0000-000000000003', 'stream_duration', 'smallint', null, false, false, false, false, null,                                           null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — subject_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'subject_id',       'integer',  false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000004', 'subject_name',     'varchar',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'subject_format',   'varchar',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'start_date',       'date',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'end_date',         'date',     true,  false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'subject_outline',  'text',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'subject_details',  'text',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'subject_textbooks','text',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000004', 'subject_refbooks', 'text',     true,  false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — stream_subject
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'stream_id',   'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000005', 'subject_id',  'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000004', 'subject_id'),
  ('a0000000-0000-0000-0000-000000000005', 'stream_part', 'smallint', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000005', 'core',        'boolean',  false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — counsellor_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000006', 'counsellor_id',    'integer', false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000006', 'counsellor_fname', 'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000006', 'counsellor_mname', 'varchar', true,  false, false, false),
  ('a0000000-0000-0000-0000-000000000006', 'counsellor_lname', 'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000006', 'qualifications',   'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000006', 'address',          'varchar', false, false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — counsellor_arrangement
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000007', 'ca_id',          'integer',  false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000007', 'counsellor_id',  'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000006', 'counsellor_id'),
  ('a0000000-0000-0000-0000-000000000007', 'stream_id',      'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000007', 'start_date',     'date',     false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000007', 'end_date',       'date',     true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000007', 'fee1',           'integer',  false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000007', 'fee2',           'integer',  false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000007', 'ca_agreement',   'bytea',    false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — institute_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000008', 'inst_id',        'integer', false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000008', 'inst_name',      'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'inst_addr',      'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'inst_city',      'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'inst_state',     'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'inst_country',   'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'inst_PIN',       'numeric', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'contact_no',     'numeric', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'contact_email',  'varchar', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'start_date',     'date',    false, false, false, false),
  ('a0000000-0000-0000-0000-000000000008', 'end_date',       'date',    true,  false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — inst_offerings
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000009', 'inst_id',            'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000009', 'stream_id',          'integer',  false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000009', 'start_date',         'date',     false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000009', 'end_date',           'date',     true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000009', 'approved_capacity',  'smallint', false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — prof_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'prof_id',        'integer',   false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'prof_fname',     'varchar',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'prof_mname',     'varchar',   true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'prof_lname',     'varchar',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'qualifications', 'varchar',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'inst_id',        'integer',   false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000010', 'start_date',     'date',      false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000010', 'end_date',       'date',      true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — prof_subject_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000011', 'prof_id',    'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000010', 'prof_id'),
  ('a0000000-0000-0000-0000-000000000011', 'subject_id', 'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000004', 'subject_id'),
  ('a0000000-0000-0000-0000-000000000011', 'start_date', 'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000011', 'end_date',   'date',    true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — fee_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000012', 'institute_id',  'integer',     false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000012', 'stream_id',     'integer',     false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000012', 'stream_part',   'smallint',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000012', 'part_fee',      'numeric',     false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000012', 'part_security', 'numeric',     false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000012', 'start_date',    'date',        false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000012', 'end_date',      'date',        true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — hostel_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000013', 'hostel_id',    'integer', false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000013', 'hostel_name',  'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000013', 'institute_id', 'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000013', 'start_date',   'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000013', 'end_date',     'date',    true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — hostel_rooms
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment) VALUES
  ('a0000000-0000-0000-0000-000000000014', 'hostelroom_id',     'integer',  false, true,  true,  true),
  ('a0000000-0000-0000-0000-000000000014', 'hostelroom_number', 'varchar',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'hostelroom_desc',   'varchar',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_capacity',     'smallint', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_type',         'smallint', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_charges1',     'numeric',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_charges2',     'numeric',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_charges3',     'numeric',  false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'room_count',        'smallint', false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'start_date',        'date',     false, false, false, false),
  ('a0000000-0000-0000-0000-000000000014', 'end_date',          'date',     true,  false, false, false)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — transport_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000015', 'transport_id',    'integer', false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'institute_id',    'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000015', 'route_name',      'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_details',   'text',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_capacity',  'smallint',false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_charges1',  'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_charges2',  'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_charges3',  'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_charges4',  'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'route_charges5',  'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'start_date',      'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000015', 'end_date',        'date',    true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — institute_resources
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000016', 'resource_id',       'integer', false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'institute_id',      'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000016', 'resource_name',     'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'resource_type',     'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'resource_capacity', 'integer', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'resource_location', 'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'start_date',        'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000016', 'end_date',          'date',    true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — inquiry_details
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000017', 'inquiry_id',       'bigint',  false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000017', 'inq_student_id',   'bigint',  false, false, false, false, 'a0000000-0000-0000-0000-000000000001', 'inquiry_id'),
  ('a0000000-0000-0000-0000-000000000017', 'stream_id',        'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000017', 'counsellor_id',    'integer', true,  false, false, false, 'a0000000-0000-0000-0000-000000000006', 'counsellor_id'),
  ('a0000000-0000-0000-0000-000000000017', 'inq_city',         'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000017', 'inq_state',        'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000017', 'inq_country',      'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000017', 'inq_year',         'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000017', 'inq_month',        'numeric', false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — registration_fee
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000018', 'institute_id', 'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000018', 'stream_id',    'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000018', 'fee',          'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000018', 'start_date',   'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000018', 'end_date',     'date',    true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — registration
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000019', 'regn_id',                  'bigint',  false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'inq_student_id',           'bigint',  false, false, false, false, 'a0000000-0000-0000-0000-000000000001', 'inquiry_id'),
  ('a0000000-0000-0000-0000-000000000019', 'regn_fee',                 'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'regn_pmt_ref',             'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'institute_id',             'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000008', 'inst_id'),
  ('a0000000-0000-0000-0000-000000000019', 'stream_id',                'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000019', 'stream_part',              'smallint',false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'class_10_percent',         'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'class_10_marksheet',       'bytea',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'class_12_percent',         'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'class_12_marksheet',       'bytea',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'photograph',               'bytea',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'signatures',               'bytea',   false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'entrance_exam_name',       'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'entrance_rank_score',      'numeric', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'entrance_score_document',  'bytea',   true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'hostelroom_id',            'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000014', 'hostelroom_id'),
  ('a0000000-0000-0000-0000-000000000019', 'route_id',                 'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000015', 'transport_id'),
  ('a0000000-0000-0000-0000-000000000019', 'approver_name',            'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'approval_status',          'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'approver_comments',        'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'approved_discount',        'numeric', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'action_date',              'date',    true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'approval_validity_date',   'date',    true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'amount_paid',              'numeric', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000019', 'pmt_tx_ref',               'varchar', true,  false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — enrollment_master
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000020', 'enrollment_id',      'bigint',  false, true,  true,  true,  null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'regn_id',            'bigint',  false, false, false, false, 'a0000000-0000-0000-0000-000000000019', 'regn_id'),
  ('a0000000-0000-0000-0000-000000000020', 'enrollment_number',  'varchar', false, true,  false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'student_fname',      'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'student_mname',      'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'student_lname',      'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'dob',                'date',    true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'related_person_name','varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'relation',           'varchar', true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'enrollment_date',    'date',    true,  false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'stream_id',          'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000003', 'stream_id'),
  ('a0000000-0000-0000-0000-000000000020', 'stream_part',        'smallint',false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'pmt_tx_ref',         'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000020', 'pmt_amount',         'numeric', false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — hostel_allotment
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000021', 'enrollment_id',  'bigint',  false, false, false, false, 'a0000000-0000-0000-0000-000000000020', 'enrollment_id'),
  ('a0000000-0000-0000-0000-000000000021', 'hostelroom_id',  'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000014', 'hostelroom_id'),
  ('a0000000-0000-0000-0000-000000000021', 'pmt_tx_ref',     'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000021', 'pmt_amount',     'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000021', 'start_date',     'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000021', 'end_date',       'date',    false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS — transport_allotment
-- ─────────────────────────────────────────────────────────────
INSERT INTO module_columns (module_id, column_name, db_data_type, is_nullable, is_unique, is_primary_key, is_auto_increment, foreign_module_id, foreign_column_name) VALUES
  ('a0000000-0000-0000-0000-000000000022', 'enrollment_id', 'bigint',  false, false, false, false, 'a0000000-0000-0000-0000-000000000020', 'enrollment_id'),
  ('a0000000-0000-0000-0000-000000000022', 'transport_id',  'integer', false, false, false, false, 'a0000000-0000-0000-0000-000000000015', 'transport_id'),
  ('a0000000-0000-0000-0000-000000000022', 'pmt_tx_ref',    'varchar', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000022', 'pmt_amount',    'numeric', false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000022', 'start_date',    'date',    false, false, false, false, null,                                   null),
  ('a0000000-0000-0000-0000-000000000022', 'end_date',      'date',    false, false, false, false, null,                                   null)
ON CONFLICT DO NOTHING;

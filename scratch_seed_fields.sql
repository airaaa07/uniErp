-- ─────────────────────────────────────────────────────────────
-- FIELD SEEDING SCRIPT
-- ─────────────────────────────────────────────────────────────

-- 1. inquiry_master remaining fields
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('inquiry_master', 'Mobile Number', 'mobile_no', 'text', 'General', true, true, 5),
  ('inquiry_master', 'Parent Contact Name', 'related_person_name', 'text', 'General', true, true, 6),
  ('inquiry_master', 'Relation to Parent', 'relation', 'text', 'General', true, true, 7),
  ('inquiry_master', 'Class 10th Percentage', 'class_10_percent', 'number', 'Academic', true, true, 8),
  ('inquiry_master', 'Class 12th Percentage', 'class_12_percent', 'number', 'Academic', true, true, 9),
  ('inquiry_master', 'Nationality', 'nationality', 'text', 'General', true, true, 10),
  ('inquiry_master', 'Inquiry Status', 'inquiry_status', 'select', 'General', true, true, 12)
ON CONFLICT (field_key) DO NOTHING;

-- 2. institute_master (college creation fields)
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('institute_master', 'College/Institute Name', 'inst_name', 'text', 'General', true, true, 1),
  ('institute_master', 'Address', 'inst_addr', 'text', 'General', true, true, 2),
  ('institute_master', 'City', 'inst_city', 'text', 'General', true, true, 3),
  ('institute_master', 'State', 'inst_state', 'text', 'General', true, true, 4),
  ('institute_master', 'Country', 'inst_country', 'text', 'General', true, true, 5),
  ('institute_master', 'PIN Code', 'inst_PIN', 'number', 'General', true, true, 6),
  ('institute_master', 'Contact Number', 'contact_no', 'text', 'General', true, true, 7),
  ('institute_master', 'Contact Email', 'contact_email', 'text', 'General', true, true, 8),
  ('institute_master', 'Establishment Date', 'inst_start_date', 'date', 'General', true, true, 9),
  ('institute_master', 'Closure Date', 'inst_end_date', 'date', 'General', true, false, 10)
ON CONFLICT (field_key) DO NOTHING;

-- 3. streams_master
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('streams_master', 'Course', 'stream_course_id', 'select', 'course_master', true, true, 1),
  ('streams_master', 'Stream Name', 'stream_name', 'text', 'General', true, true, 2),
  ('streams_master', 'Stream Format', 'stream_format', 'text', 'General', true, true, 3),
  ('streams_master', 'Stream Duration (Years)', 'stream_duration', 'number', 'General', true, true, 4)
ON CONFLICT (field_key) DO NOTHING;

-- 4. subject_master
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('subject_master', 'Subject Name', 'subject_name', 'text', 'General', true, true, 1),
  ('subject_master', 'Subject Format', 'subject_format', 'text', 'General', true, true, 2),
  ('subject_master', 'Start Date', 'sub_start_date', 'date', 'General', true, true, 3),
  ('subject_master', 'End Date', 'sub_end_date', 'date', 'General', true, false, 4),
  ('subject_master', 'Subject Outline', 'subject_outline', 'textarea', 'Syllabus', true, true, 5),
  ('subject_master', 'Subject Details', 'subject_details', 'textarea', 'Syllabus', true, true, 6),
  ('subject_master', 'Textbooks', 'subject_textbooks', 'textarea', 'Resources', true, true, 7),
  ('subject_master', 'Reference Books', 'subject_refbooks', 'textarea', 'Resources', true, false, 8)
ON CONFLICT (field_key) DO NOTHING;

-- 5. registration
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('registration', 'Student Inquiry Ref', 'reg_inquiry_student_id', 'select', 'inquiry_master', true, true, 1),
  ('registration', 'Registration Fee', 'regn_fee', 'number', 'Payment', true, true, 2),
  ('registration', 'Payment Reference', 'regn_pmt_ref', 'text', 'Payment', true, true, 3),
  ('registration', 'College/Institute', 'reg_institute_id', 'select', 'institute_master', true, true, 4),
  ('registration', 'Stream', 'reg_stream_id', 'select', 'streams_master', true, true, 5),
  ('registration', 'Semester/Year Part', 'stream_part', 'number', 'Academic', true, true, 6),
  ('registration', 'Class 10th Percentage', 'reg_class_10_percent', 'number', 'Academic', true, true, 7),
  ('registration', 'Class 12th Percentage', 'reg_class_12_percent', 'number', 'Academic', true, true, 8),
  ('registration', 'Entrance Exam Name', 'entrance_exam_name', 'text', 'Academic', true, false, 9),
  ('registration', 'Entrance Score/Rank', 'entrance_rank_score', 'number', 'Academic', true, false, 10),
  ('registration', 'Approval Status', 'approval_status', 'select', 'General', true, true, 11),
  ('registration', 'Approver Name', 'approver_name', 'text', 'General', true, false, 12),
  ('registration', 'Approver Comments', 'approver_comments', 'text', 'General', true, false, 13)
ON CONFLICT (field_key) DO NOTHING;

-- 6. enrollment_master
INSERT INTO fields (module_key, label, field_key, field_type, field_group_name, is_visible, is_mandatory, sort_order) VALUES
  ('enrollment_master', 'Registration Ref', 'enroll_registration_id', 'select', 'registration', true, true, 1),
  ('enrollment_master', 'Enrollment Number', 'enrollment_number', 'text', 'General', true, true, 2),
  ('enrollment_master', 'Student First Name', 'student_fname', 'text', 'General', true, true, 3),
  ('enrollment_master', 'Student Last Name', 'student_lname', 'text', 'General', true, true, 4),
  ('enrollment_master', 'Enrollment Date', 'enrollment_date', 'date', 'General', true, true, 5),
  ('enrollment_master', 'Stream', 'enroll_stream_id', 'select', 'streams_master', true, true, 6),
  ('enrollment_master', 'Semester/Year Part', 'enroll_stream_part', 'number', 'Academic', true, true, 7),
  ('enrollment_master', 'Payment Tx Ref', 'enroll_pmt_tx_ref', 'text', 'Payment', true, true, 8),
  ('enrollment_master', 'Payment Amount', 'pmt_amount', 'number', 'Payment', true, true, 9)
ON CONFLICT (field_key) DO NOTHING;

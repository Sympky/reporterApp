CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "projects"(
  "id" integer primary key autoincrement not null,
  "client_id" integer not null,
  "name" varchar not null,
  "description" text,
  "due_date" datetime,
  "status" varchar not null,
  "created_by" integer not null,
  "updated_by" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "notes" text,
  foreign key("client_id") references "clients"("id") on delete cascade,
  foreign key("created_by") references "users"("id"),
  foreign key("updated_by") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "clients"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "description" text,
  "emails" text,
  "phone_numbers" text,
  "addresses" varchar,
  "website_urls" varchar,
  "other_contact_info" text,
  "created_by" integer not null,
  "updated_by" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id"),
  foreign key("updated_by") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "vulnerabilities"(
  "id" integer primary key autoincrement not null,
  "created_at" datetime,
  "updated_at" datetime,
  "name" varchar not null,
  "description" text,
  "recommendations" text,
  "impact" text,
  "references" text,
  "affected_resources" text,
  "tags" text,
  "cve" varchar,
  "cvss" varchar,
  "severity" varchar check("severity" in('info', 'low', 'medium', 'high', 'critical')),
  "likelihood_score" varchar check("likelihood_score" in('info', 'low', 'medium', 'high', 'critical')),
  "remediation_score" varchar check("remediation_score" in('info', 'low', 'medium', 'high', 'critical')),
  "impact_score" varchar check("impact_score" in('info', 'low', 'medium', 'high', 'critical')),
  "is_template" tinyint(1) not null default '0',
  "project_id" integer,
  "discovered_at" date,
  "evidence" text,
  "created_by" integer,
  "updated_by" integer,
  "status" varchar,
  "remediation_steps" text,
  "proof_of_concept" text,
  "affected_components" text,
  "notes" text,
  foreign key("project_id") references "projects"("id") on delete cascade,
  foreign key("created_by") references "users"("id") on delete cascade,
  foreign key("updated_by") references "users"("id") on delete cascade
);
CREATE INDEX "vulnerabilities_is_template_index" on "vulnerabilities"(
  "is_template"
);
CREATE TABLE IF NOT EXISTS "personal_access_tokens"(
  "id" integer primary key autoincrement not null,
  "tokenable_type" varchar not null,
  "tokenable_id" integer not null,
  "name" varchar not null,
  "token" varchar not null,
  "abilities" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens"(
  "tokenable_type",
  "tokenable_id"
);
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" on "personal_access_tokens"(
  "token"
);
CREATE TABLE IF NOT EXISTS "notes"(
  "id" integer primary key autoincrement not null,
  "content" text not null,
  "notable_type" varchar not null,
  "notable_id" integer not null,
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE INDEX "notes_notable_type_notable_id_index" on "notes"(
  "notable_type",
  "notable_id"
);
CREATE TABLE IF NOT EXISTS "files"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "original_name" varchar not null,
  "mime_type" varchar not null,
  "size" integer not null,
  "path" varchar not null,
  "fileable_type" varchar not null,
  "fileable_id" integer not null,
  "uploaded_by" integer,
  "description" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("uploaded_by") references "users"("id") on delete set null
);
CREATE INDEX "files_fileable_type_fileable_id_index" on "files"(
  "fileable_type",
  "fileable_id"
);
CREATE TABLE IF NOT EXISTS "methodologies"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "content" text,
  "created_by" integer,
  "updated_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id") on delete set null,
  foreign key("updated_by") references "users"("id") on delete set null
);
CREATE TABLE IF NOT EXISTS "report_templates"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "file_path" varchar not null,
  "description" text,
  "created_by" integer not null,
  "updated_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id"),
  foreign key("updated_by") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "report_methodologies"(
  "id" integer primary key autoincrement not null,
  "report_id" integer not null,
  "methodology_id" integer not null,
  "order" integer not null default '0',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("report_id") references "reports"("id") on delete cascade,
  foreign key("methodology_id") references "methodologies"("id")
);
CREATE TABLE IF NOT EXISTS "report_findings"(
  "id" integer primary key autoincrement not null,
  "report_id" integer not null,
  "vulnerability_id" integer not null,
  "order" integer not null default '0',
  "include_evidence" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("report_id") references "reports"("id") on delete cascade,
  foreign key("vulnerability_id") references "vulnerabilities"("id")
);
CREATE TABLE IF NOT EXISTS "reports"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "report_template_id" integer,
  "client_id" integer not null,
  "project_id" integer not null,
  "executive_summary" text,
  "status" varchar not null default('draft'),
  "generated_file_path" varchar,
  "created_by" integer not null,
  "updated_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "generate_from_scratch" tinyint(1) not null default('0'),
  foreign key("updated_by") references users("id") on delete no action on update no action,
  foreign key("created_by") references users("id") on delete no action on update no action,
  foreign key("project_id") references projects("id") on delete no action on update no action,
  foreign key("client_id") references clients("id") on delete no action on update no action,
  foreign key("report_template_id") references report_templates("id") on delete no action on update no action
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2025_03_02_172002_create_projects_table',1);
INSERT INTO migrations VALUES(5,'2025_03_02_172038_create_clients_table',1);
INSERT INTO migrations VALUES(6,'2025_03_03_184206_create_vulnerabilities_table',1);
INSERT INTO migrations VALUES(7,'2025_03_04_210229_create_personal_access_tokens_table',1);
INSERT INTO migrations VALUES(8,'2025_03_07_220924_add_missing_fields_to_vulnerabilities_table',2);
INSERT INTO migrations VALUES(9,'2025_03_07_231918_add_notes_to_projects_table',3);
INSERT INTO migrations VALUES(10,'2025_03_07_231918_add_notes_to_vulnerabilities_table',3);
INSERT INTO migrations VALUES(11,'2025_03_07_233139_create_notes_table',4);
INSERT INTO migrations VALUES(12,'2025_03_07_234249_create_files_table',5);
INSERT INTO migrations VALUES(13,'2025_03_07_220811_add_missing_fields_to_vulnerabilities_table',6);
INSERT INTO migrations VALUES(14,'2025_03_08_100000_create_methodologies_table',6);
INSERT INTO migrations VALUES(15,'2025_03_09_123220_create_report_templates_table',7);
INSERT INTO migrations VALUES(16,'2025_03_09_123230_create_reports_table',7);
INSERT INTO migrations VALUES(17,'2025_03_09_123240_create_report_methodologies_table',7);
INSERT INTO migrations VALUES(18,'2025_03_09_123249_create_report_findings_table',7);
INSERT INTO migrations VALUES(19,'2025_03_09_183800_update_existing_report_templates_to_public_disk',8);
INSERT INTO migrations VALUES(20,'2025_03_09_213540_add_generate_from_scratch_to_reports_table',9);
INSERT INTO migrations VALUES(21,'2025_03_09_214819_make_report_template_id_nullable_in_reports_table',10);

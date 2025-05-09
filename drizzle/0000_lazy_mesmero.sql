CREATE TABLE IF NOT EXISTS "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"check_in_location" json,
	"check_out_location" json,
	"check_in_ip" varchar(45),
	"check_out_ip" varchar(45),
	"check_in_device" json,
	"check_out_device" json,
	"work_duration" integer,
	"status" varchar(20) DEFAULT 'present' NOT NULL,
	"check_out_type" varchar(20) DEFAULT 'manual',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_date" timestamp NOT NULL,
	"total_present" integer DEFAULT 0 NOT NULL,
	"total_late" integer DEFAULT 0 NOT NULL,
	"total_absent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"total_present" integer DEFAULT 0 NOT NULL,
	"total_late" integer DEFAULT 0 NOT NULL,
	"total_absent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" varchar(7) NOT NULL,
	"total_present" integer DEFAULT 0 NOT NULL,
	"total_late" integer DEFAULT 0 NOT NULL,
	"total_absent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"role" varchar(20) DEFAULT 'employee' NOT NULL,
	"department" varchar(50),
	"position" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

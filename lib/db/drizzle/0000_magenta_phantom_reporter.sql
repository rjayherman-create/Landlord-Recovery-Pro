CREATE TABLE "grievances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"owner_name" text NOT NULL,
	"owner_phone" text,
	"owner_email" text,
	"owner_mailing_address" text,
	"property_address" text NOT NULL,
	"county" text NOT NULL,
	"municipality" text NOT NULL,
	"school_district" text,
	"parcel_id" text,
	"property_class" text,
	"year_built" integer,
	"living_area" numeric(10, 2),
	"lot_size" text,
	"tax_year" integer NOT NULL,
	"current_assessment" numeric(12, 2) NOT NULL,
	"equalization_rate" numeric(8, 4),
	"estimated_market_value" numeric(12, 2) NOT NULL,
	"requested_assessment" numeric(12, 2) NOT NULL,
	"state" text DEFAULT 'NY' NOT NULL,
	"basis_of_complaint" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"filing_deadline" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comparables" (
	"id" serial PRIMARY KEY NOT NULL,
	"grievance_id" integer NOT NULL,
	"address" text NOT NULL,
	"sale_price" numeric(12, 2) NOT NULL,
	"sale_date" text NOT NULL,
	"square_feet" numeric(10, 2),
	"bedrooms" integer,
	"bathrooms" numeric(4, 1),
	"assessed_value" numeric(12, 2),
	"lot_size" text,
	"year_built" integer,
	"distance" text,
	"source_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"stripe_customer_id" varchar,
	"subscription_status" varchar,
	"plan" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "filing_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" varchar(2) NOT NULL,
	"county" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer,
	"message" text,
	"send_at" timestamp,
	"sent" text DEFAULT 'false',
	"type" text
);
--> statement-breakpoint
CREATE TABLE "small_claims_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"claim_type" text NOT NULL,
	"state" text DEFAULT 'NY' NOT NULL,
	"county" text,
	"court_location" text,
	"claimant_name" text NOT NULL,
	"claimant_email" text,
	"claimant_phone" text,
	"claimant_address" text,
	"defendant_name" text NOT NULL,
	"defendant_address" text,
	"defendant_email" text,
	"defendant_phone" text,
	"claim_amount" numeric(12, 2) NOT NULL,
	"claim_description" text NOT NULL,
	"claim_basis" text,
	"incident_date" text,
	"desired_outcome" text,
	"supporting_facts" text,
	"generated_statement" text,
	"conversation_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"last_update" text,
	"filing_deadline" text,
	"hearing_date" text,
	"case_number" text,
	"notes" text,
	"stripe_session_id" text,
	"paid_at" timestamp,
	"plan" text DEFAULT 'basic',
	"email_reminders" text DEFAULT 'true',
	"sms_reminders" text DEFAULT 'false',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "small_claims_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_mode" varchar(40) DEFAULT 'landlord' NOT NULL,
	"case_type" varchar(60) NOT NULL,
	"claimant_name" varchar(255) NOT NULL,
	"business_name" varchar(255),
	"property_name" varchar(255),
	"unit_label" varchar(255),
	"subject_name" varchar(255) NOT NULL,
	"guarantor_name" varchar(255),
	"last_known_address" text,
	"subject_phone" varchar(50),
	"subject_email" varchar(255),
	"move_out_date" date,
	"service_start_date" date,
	"service_end_date" date,
	"amount_owed" numeric(12, 2) NOT NULL,
	"rent_owed" numeric(12, 2) DEFAULT '0',
	"damage_owed" numeric(12, 2) DEFAULT '0',
	"utility_owed" numeric(12, 2) DEFAULT '0',
	"other_owed" numeric(12, 2) DEFAULT '0',
	"notes" text,
	"source_meta" jsonb,
	"generated_statement" text,
	"conversation_id" uuid,
	"user_id" text,
	"status" varchar(60) DEFAULT 'draft' NOT NULL,
	"stripe_session_id" text,
	"paid_at" timestamp,
	"plan" text DEFAULT 'basic',
	"email_reminders" boolean DEFAULT true,
	"sms_reminders" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_type" varchar(60) NOT NULL,
	"state" varchar(10) DEFAULT 'NY' NOT NULL,
	"landlord_name" varchar(255) NOT NULL,
	"landlord_company" varchar(255),
	"landlord_address" text,
	"landlord_email" varchar(255),
	"landlord_phone" varchar(50),
	"tenant_name" varchar(255) NOT NULL,
	"tenant_email" varchar(255),
	"tenant_phone" varchar(50),
	"tenant_address" text,
	"property_address" text NOT NULL,
	"monthly_rent" numeric(12, 2),
	"claim_amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"lease_start_date" date,
	"lease_end_date" date,
	"move_out_date" date,
	"months_owed" integer DEFAULT 0,
	"rent_period" text,
	"demand_letter_text" text,
	"status" varchar(60) DEFAULT 'draft' NOT NULL,
	"court_date" date,
	"judgment_amount" numeric(12, 2),
	"recovered_amount" numeric(12, 2),
	"service_method" varchar(100),
	"service_date" date,
	"service_notes" text,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"filing_kit_paid_at" timestamp,
	"filing_kit_stripe_session_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_case_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"category" varchar(50) DEFAULT 'other' NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"notes" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" varchar(10) NOT NULL,
	"county" varchar(100) NOT NULL,
	"court_name" text NOT NULL,
	"court_type" varchar(80) DEFAULT 'Small Claims' NOT NULL,
	"max_claim" integer NOT NULL,
	"address" text NOT NULL,
	"filing_room" text,
	"filing_hours" text,
	"phone" varchar(50),
	"filing_fee" integer,
	"service_fee_min" integer,
	"service_fee_max" integer,
	"online_filing" boolean DEFAULT false NOT NULL,
	"online_url" text,
	"payment_methods" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_case_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"method" varchar(80) DEFAULT 'other' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_contact_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"method" varchar(40) NOT NULL,
	"result" text,
	"contacted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"type" varchar(40) NOT NULL,
	"value" text NOT NULL,
	"source" text,
	"status" varchar(20) DEFAULT 'unverified' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_case_id_small_claims_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."small_claims_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
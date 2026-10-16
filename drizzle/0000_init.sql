CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"claimant_handle" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"salvaged_at" timestamp with time zone,
	"permit_number" text,
	"acknowledged_rules" boolean NOT NULL,
	"intended_use" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy_m" integer,
	"state_code" text NOT NULL,
	"road_name" text,
	"species" text NOT NULL,
	"species_category" text NOT NULL,
	"sex" text DEFAULT 'unknown' NOT NULL,
	"age_class" text DEFAULT 'unknown' NOT NULL,
	"condition" text DEFAULT 'unknown' NOT NULL,
	"status" text DEFAULT 'reported' NOT NULL,
	"eligibility" text NOT NULL,
	"regs_version" text NOT NULL,
	"reporter_handle" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_state_idx" ON "reports" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "reports_observed_idx" ON "reports" USING btree ("observed_at");
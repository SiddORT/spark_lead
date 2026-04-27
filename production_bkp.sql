--
-- PostgreSQL database dump
--

\restrict xglCeVbBQQZENZdQoFSX8BsAVWUE3UyxU9hnajYswi85MN8XVfo0L9N3waTy81n

-- Dumped from database version 16.12 (0c42b1f)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'member',
    'lead_owner',
    'deal_handler'
);


ALTER TYPE public.app_role OWNER TO neondb_owner;

--
-- Name: decision_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.decision_role AS ENUM (
    'champion',
    'gatekeeper',
    'economic_buyer'
);


ALTER TYPE public.decision_role OWNER TO neondb_owner;

--
-- Name: emotional_state; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.emotional_state AS ENUM (
    'skeptical',
    'enthusiastic',
    'frustrated'
);


ALTER TYPE public.emotional_state OWNER TO neondb_owner;

--
-- Name: friction_point; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.friction_point AS ENUM (
    'scaling',
    'tech_debt',
    'budget'
);


ALTER TYPE public.friction_point OWNER TO neondb_owner;

--
-- Name: kill_reason; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.kill_reason AS ENUM (
    'feature_gap',
    'price',
    'ghosted'
);


ALTER TYPE public.kill_reason OWNER TO neondb_owner;

--
-- Name: lead_outcome; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.lead_outcome AS ENUM (
    'closed',
    'lost',
    'wip',
    'delayed'
);


ALTER TYPE public.lead_outcome OWNER TO neondb_owner;

--
-- Name: lead_stage; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.lead_stage AS ENUM (
    'discovery',
    'qualification',
    'strategy',
    'resolution'
);


ALTER TYPE public.lead_stage OWNER TO neondb_owner;

--
-- Name: lead_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.lead_type AS ENUM (
    'hot',
    'warm',
    'cold',
    'ghosted'
);


ALTER TYPE public.lead_type OWNER TO neondb_owner;

--
-- Name: strategic_tier; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.strategic_tier AS ENUM (
    'high',
    'med',
    'low'
);


ALTER TYPE public.strategic_tier OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.access_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    department text,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.access_requests OWNER TO neondb_owner;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text,
    details jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO neondb_owner;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    industry text,
    notes text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: company_services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    service_id uuid NOT NULL
);


ALTER TABLE public.company_services OWNER TO neondb_owner;

--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    note_content text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lead_activities OWNER TO neondb_owner;

--
-- Name: lead_companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    company_id uuid NOT NULL
);


ALTER TABLE public.lead_companies OWNER TO neondb_owner;

--
-- Name: lead_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    uploaded_by uuid,
    stage text,
    status text,
    note_id uuid
);


ALTER TABLE public.lead_documents OWNER TO neondb_owner;

--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    stage_context text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    follow_up_date date
);


ALTER TABLE public.lead_notes OWNER TO neondb_owner;

--
-- Name: lead_value_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_value_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    old_value text,
    new_value text,
    changed_at timestamp without time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    reason text
);


ALTER TABLE public.lead_value_history OWNER TO neondb_owner;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_name text NOT NULL,
    created_by uuid,
    stage public.lead_stage DEFAULT 'discovery'::public.lead_stage NOT NULL,
    lead_type public.lead_type,
    contact_email text,
    phone text,
    service_id uuid,
    company text,
    lead_owner text,
    deal_handler text,
    deal_value text,
    value text,
    follow_up_date date,
    next_action text,
    source_context text,
    emotional_state public.emotional_state,
    decision_role public.decision_role,
    strategic_tier public.strategic_tier,
    custom_hook text,
    objection text,
    outcome public.lead_outcome,
    kill_reason public.kill_reason,
    internal_rating integer,
    resolved_at timestamp without time zone,
    friction_point public.friction_point,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    pipeline_stage_id uuid,
    pipeline_status_id uuid,
    description text,
    lead_kill_reason text,
    final_value text,
    value_updated_at timestamp without time zone,
    value_updated_by text,
    closure_note text
);


ALTER TABLE public.leads OWNER TO neondb_owner;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    color text DEFAULT '#6b7a9a'::text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_terminal boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pipeline_stages OWNER TO neondb_owner;

--
-- Name: pipeline_statuses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pipeline_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stage_id uuid NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    color text DEFAULT '#6b7a9a'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_won boolean DEFAULT false NOT NULL,
    is_lost boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pipeline_statuses OWNER TO neondb_owner;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_name public.app_role NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    allowed boolean DEFAULT true NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO neondb_owner;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'member'::public.app_role NOT NULL
);


ALTER TABLE public.user_roles OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    display_name text NOT NULL,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: whitelisted_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.whitelisted_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    assigned_role public.app_role DEFAULT 'member'::public.app_role NOT NULL,
    invited_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.whitelisted_users OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	eb97b13d-59fc-4b44-b3ca-41d767df1987	12592fda-7700-4aca-9302-cddfa621d801	7	2026-03-30 13:33:23.830473+00
2	fb969288-5290-4b63-b4a1-ac65041eb927	12592fda-7700-4aca-9302-cddfa621d801	3	2026-03-31 12:23:43.630736+00
3	9e234bbf-0856-4784-a111-59bdfabdb629	12592fda-7700-4aca-9302-cddfa621d801	3	2026-03-31 12:43:03.873119+00
4	8b88c661-75b2-44f7-8044-1d3924bb6e5f	12592fda-7700-4aca-9302-cddfa621d801	2	2026-04-08 15:43:12.334482+00
5	acbbbb48-fcfa-452a-a2b1-c25b5d690f22	12592fda-7700-4aca-9302-cddfa621d801	1	2026-04-18 19:20:26.015443+00
6	491e8501-2d24-4371-8b67-06c124159a9e	12592fda-7700-4aca-9302-cddfa621d801	11	2026-04-27 08:12:50.182134+00
\.


--
-- Data for Name: access_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.access_requests (id, name, email, department, reason, status, reviewed_by, reviewed_at, created_at) FROM stdin;
1716e96a-70ff-4ace-86bf-9ee216f75a34	Zeel 	zeel.karatela@onerooftech.com	\N	\N	approved	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 06:48:22.942	2026-04-02 06:47:42.291128
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_log (id, user_id, action, resource, resource_id, details, created_at) FROM stdin;
e4f36f01-cb60-4cac-b312-f25522f4afbc	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	ec8fdbbc-68a3-4a14-940e-00308ee8512a	{"role": "admin", "email": "charmi.patel@onerooftech.com", "emailSent": true}	2026-03-30 10:15:04.16851
c83780bf-5a78-4f5e-8fc2-ad93f1f8d32d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	{"role": "admin", "email": "siddharth.karanjekar@onerooftech.com", "emailSent": true}	2026-03-30 10:15:57.457601
8855c03c-1512-4be5-aeb8-c9f9d930c83d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	2db3bd18-6b0f-4992-b783-47a05c8f630c	{"role": "admin", "email": "sidhuajay955@gmail.com", "emailSent": true}	2026-03-30 10:23:03.379521
9a3e04c4-dd65-41fb-8c11-2542bf2f39a7	2db3bd18-6b0f-4992-b783-47a05c8f630c	user_invited	team	e48cf338-0e13-40af-a9fb-9d54797b85c4	{"role": "deal_handler", "email": "siddharthajay955@gmail.com", "emailSent": true}	2026-03-30 10:26:27.632335
d0ce1a57-0fd4-4b18-80ce-fd66b2a357fc	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_deleted	team	ec8fdbbc-68a3-4a14-940e-00308ee8512a	{"email": "charmi.patel@onerooftech.com", "displayName": "charmi.patel"}	2026-03-31 11:29:44.375932
c8af7bae-a750-473f-9825-498c7beb3c61	6f65730a-b2a4-475c-9ffe-45f4f7347b97	delete	leads	ed17a5bc-a793-4d6e-b694-b607b5513b49	{"leadName": "Acme Corp Expansion"}	2026-03-31 11:30:07.912427
3902724b-76ab-4b4d-823b-e5eaaead10cd	6f65730a-b2a4-475c-9ffe-45f4f7347b97	delete	leads	2e58c435-e482-46a5-8e07-23df9c71c2b3	{"leadName": "sdcd"}	2026-03-31 11:30:11.620743
4a2302ad-547f-4439-b5a2-e07351b90931	6f65730a-b2a4-475c-9ffe-45f4f7347b97	stage_created	pipeline_stages	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	{"displayName": "Lead Initiation"}	2026-03-31 11:31:45.904021
01b81a4a-b2b6-4d47-a7d5-17bd11c067e2	6f65730a-b2a4-475c-9ffe-45f4f7347b97	stage_created	pipeline_stages	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	{"displayName": "Qualification & Analysis"}	2026-03-31 11:32:41.571534
707715b3-5f02-448f-bda1-817f145c1b1d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	stage_created	pipeline_stages	f41ce2e9-690e-4446-9b28-a3fe0057b01c	{"displayName": "Proposal & Negotiation"}	2026-03-31 11:33:57.465172
d0c50be3-8ce3-4e98-89ca-1bd9bfea805d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	stage_created	pipeline_stages	bd2c3618-323a-4bf5-aa87-cf4224c48185	{"displayName": "Closure"}	2026-03-31 11:35:07.59873
128371e7-069b-42c2-89e4-c24b5b88bfbc	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	d8aed9b8-1b13-4206-9982-653bd01d0623	{"role": "admin", "email": "chirag@onerooftech.com", "emailSent": true}	2026-04-01 14:32:15.342336
8a68eb6f-8d81-4fcc-8345-8ad67e6ab74b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	delete	leads	9f25b251-4f27-41bd-86be-ea4fb0408a34	{"leadName": "Acme Corp Expansion"}	2026-04-02 03:37:57.159934
ab800404-2d84-424e-9fa2-de9c5587bf40	6f65730a-b2a4-475c-9ffe-45f4f7347b97	delete	leads	444eb785-2e3c-4869-91f5-66eaf98bec74	{"leadName": "Tata Motors Fleet Expansion"}	2026-04-02 03:38:04.433466
dbc749a1-af94-413a-b335-4883c68a187e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"role": "lead_owner", "email": "shashwat.hegde@onerooftech.com", "emailSent": true}	2026-04-02 04:33:39.140147
c2f2732e-94f0-422e-a419-fe49370693f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	2ee5a850-f5e2-491e-9acf-799d9774cd21	{"role": "member", "email": "zeel.karatela@onerooftech.com", "emailSent": true}	2026-04-02 04:36:42.045319
5f2e23bd-136e-4428-9496-1713b95e9492	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "member"}	2026-04-02 04:38:33.151275
5bc983d5-002e-40ae-9638-9ea24e7515f0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "deal_handler"}	2026-04-02 04:39:00.519733
ecf8a612-5c89-44c4-9602-00ae14a72327	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "admin"}	2026-04-02 04:39:24.119812
7bab9375-fafe-4b2e-b66d-740906d2f5c7	6f65730a-b2a4-475c-9ffe-45f4f7347b97	permission_change	settings	member:leads:create	{"action": "create", "allowed": true, "resource": "leads", "roleName": "member"}	2026-04-02 04:40:38.472803
9a3cc041-c24b-4ed7-acc9-7e02f7e90c92	6f65730a-b2a4-475c-9ffe-45f4f7347b97	permission_change	settings	deal_handler:leads:create	{"action": "create", "allowed": true, "resource": "leads", "roleName": "deal_handler"}	2026-04-02 04:40:41.249922
42607476-9a00-48cd-847d-bf28fde71633	6f65730a-b2a4-475c-9ffe-45f4f7347b97	permission_change	settings	deal_handler:services:create	{"action": "create", "allowed": true, "resource": "services", "roleName": "deal_handler"}	2026-04-02 04:41:18.374623
89d9417c-ccc9-4b69-8144-99befd0f282e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	permission_change	settings	lead_owner:services:create	{"action": "create", "allowed": true, "resource": "services", "roleName": "lead_owner"}	2026-04-02 04:41:20.480928
f418d00a-077d-4785-9ebb-ea431799568e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	permission_change	settings	deal_handler:reports:read	{"action": "read", "allowed": true, "resource": "reports", "roleName": "deal_handler"}	2026-04-02 04:41:29.375246
0684bea3-678e-4a84-8de6-502f58d8ec99	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "lead_owner"}	2026-04-02 04:41:47.807257
7e2c4d31-b731-4459-a694-bb64ddb57c1c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "admin"}	2026-04-02 04:51:18.695178
b1530754-a095-4bbe-ac04-9cabce426473	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	58747f3c-2203-4a49-9450-c539d1da98d6	{"role": "admin", "email": "smit.lalai@onerooftech.com", "emailSent": true}	2026-04-02 04:53:07.331163
5cdf9046-8a52-44b0-8bea-e5a21f9721cd	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_deleted	team	58747f3c-2203-4a49-9450-c539d1da98d6	{"email": "smit.lalai@onerooftech.com", "displayName": "smit.lalai"}	2026-04-02 04:53:42.072781
da30988e-4583-498f-8442-3cd0abdc0142	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	945ae736-dbf9-49cc-86bd-34dd74f5a84b	{"role": "deal_handler", "email": "smit@onerooftech.com", "emailSent": true}	2026-04-02 04:53:52.454915
b5b07aec-2dcd-4d44-b3b7-98183bba4a71	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	945ae736-dbf9-49cc-86bd-34dd74f5a84b	{"email": "smit@onerooftech.com", "newRole": "admin"}	2026-04-02 04:54:18.168067
b23e5e72-3598-41ef-9a6b-5ea4beb26f9a	6f65730a-b2a4-475c-9ffe-45f4f7347b97	user_invited	team	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	{"role": "admin", "email": "brijesh@naturenergy.in", "emailSent": true}	2026-04-02 05:47:18.795479
987ec147-f23d-461f-bb3a-26e4db298f6d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	2ee5a850-f5e2-491e-9acf-799d9774cd21	{"email": "zeel.karatela@onerooftech.com", "newRole": "admin"}	2026-04-02 06:50:24.740287
ffac8ff6-262a-4e5d-80c5-fa76ad6b6454	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	f08ee1d2-e4e2-4130-8637-b1d04706af56	{"role": "admin", "email": "kenil@onerooftech.com", "emailSent": true}	2026-04-02 07:07:44.643427
508e786a-f2db-4ecb-a2f4-f1455ffe3c8f	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	{"role": "admin", "email": "siddharth@onerooftech.com", "emailSent": true}	2026-04-02 07:08:55.73289
7cf2ebbb-61bb-468e-b3c8-6416aa379d73	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	18282add-4e7f-411f-bc7c-34d5ef6bef19	{"role": "lead_owner", "email": "sandeep@purplesoil.om", "emailSent": true}	2026-04-02 07:10:25.226201
684a1d2b-2596-475f-b80b-13c809281184	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	ff6fb865-f4ae-4a00-865d-a9515317e382	{"role": "lead_owner", "email": "meghraj@hyworth.in", "emailSent": true}	2026-04-02 07:10:59.484259
542842cc-1002-49ae-9d5a-1f7ca5a9b5eb	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	3d325efb-4805-4230-ac98-d25543769e2b	{"role": "admin", "email": "sanjeev@purplesoil.com", "emailSent": true}	2026-04-02 07:11:39.945715
ee4c80ea-6f16-4f8f-9e10-ee6085154745	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	{"role": "admin", "email": "sohil@onerooftech.com", "emailSent": true}	2026-04-03 05:32:34.522083
74405dfc-6386-4ed0-9ef9-ab236b208ab6	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	8a0aa7ae-6fa3-4b61-af77-f3132beb1515	{"role": "admin", "email": "prithvi.thakker@onerooftech.com", "emailSent": true}	2026-04-03 05:34:00.013225
fe446ccc-72e5-42f3-b94b-eb2478355d48	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	d2218768-ed36-496d-86fa-34ae48a66111	{"role": "admin", "email": "yash.galiya@onerooftech.com", "emailSent": true}	2026-04-03 05:34:37.607758
ada13b0b-8228-4725-915d-1496b2727470	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	1915618a-38c5-4473-bef8-765a5555d3f1	{"role": "admin", "email": "shashikant@onerooftech.com", "emailSent": true}	2026-04-03 05:36:03.36707
4b4dedbc-42d8-48e9-b0b8-b607588e1414	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	9f0afd4f-fea4-4740-bec1-8e39d33a988b	{"role": "admin", "email": "gagan.kamble@irajtechlabs.com", "emailSent": true}	2026-04-03 05:37:53.29097
a6f37634-845e-4d25-83eb-647ec63afaca	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	7ea66e43-0d18-429b-8946-63c75984a568	{"role": "admin", "email": "yash.lokhande@irajtechlabs.com", "emailSent": true}	2026-04-03 05:38:47.539653
bf2562aa-0ee3-47a5-82bf-af906d1c6d39	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	f25282e4-45e4-4704-bac9-01214042a80b	{"role": "admin", "email": "sanket@infraconn.com", "emailSent": true}	2026-04-03 05:39:34.512645
093904ef-47fd-4a31-9e0a-fc91dc6c9a70	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	8000364a-2928-4781-8b70-4061b25b53ff	{"role": "admin", "email": "kaushik@purplesoil.com", "emailSent": true}	2026-04-03 05:42:26.251218
36b75782-0cc6-49fa-b537-14bd8481a509	d8aed9b8-1b13-4206-9982-653bd01d0623	user_invited	team	8a0aa7ae-6fa3-4b61-af77-f3132beb1515	{"role": "admin", "email": "prithvi.thakker@onerooftech.com", "emailSent": true}	2026-04-06 13:36:33.073198
6cd2963e-ea45-4e46-aacd-99114be18c30	6f65730a-b2a4-475c-9ffe-45f4f7347b97	delete	leads	098361fe-0ac0-468b-9373-3d963cff1b36	{"leadName": "LightStrom"}	2026-04-06 14:08:51.975313
eab1287b-8315-439a-98fd-95b679769ad1	2ee5a850-f5e2-491e-9acf-799d9774cd21	user_invited	team	916e4c26-2f9f-471a-8f68-9e4a287f4169	{"role": "admin", "email": "ajay@hyworth.in", "emailSent": true}	2026-04-10 14:27:49.61961
cc319bbe-aa44-4eda-b67e-858ff72d4b3b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	password_link_generated	team	945ae736-dbf9-49cc-86bd-34dd74f5a84b	{"email": "smit@onerooftech.com"}	2026-04-13 15:52:05.037566
a4dfa3d8-efef-432e-ae3e-47cf4d5f26b8	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	945ae736-dbf9-49cc-86bd-34dd74f5a84b	{"email": "smit@onerooftech.com", "newRole": "admin"}	2026-04-13 15:53:49.24881
72b159f4-ee40-4b2a-af33-8e5240b1cf04	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	ff6fb865-f4ae-4a00-865d-a9515317e382	{"email": "meghraj@hyworth.in", "newRole": "admin"}	2026-04-13 18:03:59.707221
56162601-2e94-44be-9db7-e87c0c2b54d9	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	18282add-4e7f-411f-bc7c-34d5ef6bef19	{"email": "sandeep@purplesoil.om", "newRole": "admin"}	2026-04-13 18:04:10.05014
219b0756-6df9-4ffa-8c17-c8329edfc01c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	e48cf338-0e13-40af-a9fb-9d54797b85c4	{"email": "siddharthajay955@gmail.com", "newRole": "admin"}	2026-04-13 18:04:25.576509
d55588ea-c02f-444b-984f-f55c166f361b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	role_change	team	ff6fb865-f4ae-4a00-865d-a9515317e382	{"email": "meghraj@hyworth.in", "newRole": "manager"}	2026-04-13 18:38:43.308934
2d95a69f-ef72-40db-8c1d-bb10a8f123ed	945ae736-dbf9-49cc-86bd-34dd74f5a84b	delete	leads	56bc59cc-a196-40a4-8547-20fcedb8bf12	{"leadName": "Bhumi Mall - Rooftop Solar 2"}	2026-04-16 15:43:58.626307
58bc2c96-ad80-43f2-86de-f54b3daec796	945ae736-dbf9-49cc-86bd-34dd74f5a84b	delete	leads	08bc61a4-c8dc-4bc0-8427-5b5a709a94ba	{"leadName": "Hi Design"}	2026-04-16 15:48:19.141317
2c51f903-b820-43b3-9efe-a9073f664dc6	945ae736-dbf9-49cc-86bd-34dd74f5a84b	delete	leads	13c2d467-c7ff-4638-806f-d0f30df0f33e	{"leadName": "Test"}	2026-04-16 15:54:51.343996
2755c87e-b42d-47bd-b61e-65b4e1134e0d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	916e4c26-2f9f-471a-8f68-9e4a287f4169	{"email": "ajay@hyworth.in", "newRole": "manager"}	2026-04-17 17:01:16.587397
50d80b3e-9207-4faa-82b2-89d8ae465de3	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	{"email": "brijesh@naturenergy.in", "newRole": "manager"}	2026-04-17 17:01:18.350441
ba8b2008-18e8-4a90-a611-25511c5592d8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	9f0afd4f-fea4-4740-bec1-8e39d33a988b	{"email": "gagan.kamble@irajtechlabs.com", "newRole": "manager"}	2026-04-17 17:01:23.210607
d04f7fb7-dbe7-4c5f-bafc-82ae27a6c9d3	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	8000364a-2928-4781-8b70-4061b25b53ff	{"email": "kaushik@purplesoil.com", "newRole": "manager"}	2026-04-17 17:01:26.138324
9ed04e0b-ad79-4512-9d10-ca90e630022e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	f25282e4-45e4-4704-bac9-01214042a80b	{"email": "sanket@infraconn.com", "newRole": "manager"}	2026-04-17 17:01:35.516916
72965586-c4a0-4065-96ab-ffa2f3b1013b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	2fe65a52-f4c3-416b-b999-426704e830fd	{"email": "shashwat.hegde@onerooftech.com", "newRole": "manager"}	2026-04-17 17:01:41.351936
dfd61712-5424-4346-8b7d-d096e437d371	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	1915618a-38c5-4473-bef8-765a5555d3f1	{"email": "shashikant@onerooftech.com", "newRole": "manager"}	2026-04-17 17:01:42.88118
89300a45-9fae-403a-9e62-0e37cc7f8029	945ae736-dbf9-49cc-86bd-34dd74f5a84b	role_change	team	7ea66e43-0d18-429b-8946-63c75984a568	{"email": "yash.lokhande@irajtechlabs.com", "newRole": "manager"}	2026-04-17 17:01:58.162773
77ea6c48-5010-4216-9a02-327bc317670c	f08ee1d2-e4e2-4130-8637-b1d04706af56	password_link_resent	team	d8aed9b8-1b13-4206-9982-653bd01d0623	{"email": "chirag@onerooftech.com", "emailSent": true}	2026-04-17 17:17:03.031196
18ab90c1-e2c0-49c6-a5b3-e4bcbe3999cb	f08ee1d2-e4e2-4130-8637-b1d04706af56	password_link_resent	team	d8aed9b8-1b13-4206-9982-653bd01d0623	{"email": "chirag@onerooftech.com", "emailSent": true}	2026-04-17 17:17:05.602824
ffcfb1c2-cc18-420e-be28-3efcc25ed73c	945ae736-dbf9-49cc-86bd-34dd74f5a84b	delete	leads	6138a179-7b2d-4e1a-af06-0aa0e3df6389	{"leadName": "Agivant Technologies "}	2026-04-25 09:14:29.588465
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, name, industry, notes, created_by, created_at) FROM stdin;
a457000d-2255-4325-968e-d0686a4beca2	HD Business Solutions (Prop)	Telecom Consultancy Serivces	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:14:16.178869
519d2c6f-29ef-46a2-b1b9-7f1135114aa0	Hyworth 247 Clean Energies Pvt. Ltd.	Renewables Solutions		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-03-30 07:51:12.321947
955ca5dd-1667-4f92-bda6-ad22c1db3b91	OneRoof Technologies LLP	Software Services	None	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-03-30 07:50:01.501785
7dd1bd8b-3e7b-4781-8106-50df515ab7ee	Purple Soil Technology Ventures Pvt. Ltd.	Telecom & Renewables	IP Services & Infra work	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 05:55:39.632575
dbfd588e-84bb-4a9a-8e14-cd31333f58df	Iraj Tech Labs Private Limited	Manafacturing and Inovation	\N	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-03 05:29:41.655864
974f6d1d-0ef3-4b6f-9652-bc44c07d44a2	Smilax Infocomm Pvt. Ltd.	Telecom	Telecom Tower & Infra	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-02 12:34:01.052505
bdc3d233-327c-43b2-9430-a24040d5de06	True Data Labs Pvt. Ltd.	Software	Software Applications:\n1. Keep In Touch\n2. Hospital Asset Tracking	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-03 05:28:26.054519
90928f0f-3a34-49d4-921f-02ae56df3e3e	 Infraconn Infrastructure Telecommunication Private Limited	Infra		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-02 12:33:37.449729
8ec77a3d-4558-4a5d-90ff-542a12720779	 Truedata Broadband Private Limited	Internet Service Provider		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 03:43:37.964496
2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	Blue Stratum Pvt Ltd 	Marine Industry		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:28:37.550883
46abe54d-f275-420a-af7e-9ff3b083bc77	 Nautrenergy Technology Pvt Ltd	Service		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:27:54.100841
ef127419-28ee-4206-929a-6a0719171ac8	OneRoof Launchpad	Consultancy	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-06 13:14:11.645987
8b2afa4b-d499-4ece-b16d-51c75eba9a45	 Era Infotech (Prop)	CCTV, Networking	Networking, CCTV, Hardware, Computer supply	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:27:32.216703
15da675b-4b4d-4c3a-a466-76ab6da7b5d5	Oneroof Technology Solutions Pvt. Ltd.	Technology		f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-17 17:05:09.960743
\.


--
-- Data for Name: company_services; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_services (id, company_id, service_id) FROM stdin;
899406cc-5ba1-4b58-b182-8ffb9162ccf7	8ec77a3d-4558-4a5d-90ff-542a12720779	3d1bb659-6117-4b0a-8232-8b207eb44549
e395f55f-3d17-4adb-96ee-a9a9ac7957d9	a457000d-2255-4325-968e-d0686a4beca2	3256c3f9-7400-4ae1-932b-2037578fb2d3
be4cf21a-9fc7-4b52-9d47-de3ffcf759ce	8ec77a3d-4558-4a5d-90ff-542a12720779	929946e3-0d1d-40c5-bd04-50d1606cdf35
ff7c9390-b827-4b02-8701-9ca23db8b240	8ec77a3d-4558-4a5d-90ff-542a12720779	32006777-870b-4ae9-bf95-ce0200680f41
43a4f4a9-b4e6-49ed-adea-ac7ffd448f28	955ca5dd-1667-4f92-bda6-ad22c1db3b91	1f5ae568-9cbc-4a18-a26c-de4a25dcb4fb
446279c3-aeb3-45f6-982b-c751664f5e72	a457000d-2255-4325-968e-d0686a4beca2	1f5ae568-9cbc-4a18-a26c-de4a25dcb4fb
84744564-ff9f-4c56-a600-96730f9ea783	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	29cc66aa-92e8-408a-9da3-84bdaacf9b73
3edd64be-633e-4b3e-8d80-fdb15fd15900	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	0f0dceed-e5ef-46cb-8a41-7af1efc8a37b
39a54e7e-e2d8-4496-a4b9-387bd8908ded	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	e6e731ee-4067-4e3b-9c7b-99ce75838b48
984b7acc-329d-4f46-8138-d1f7cd3d0923	519d2c6f-29ef-46a2-b1b9-7f1135114aa0	d38915dc-ecf3-45f6-ad3e-874212c27666
3a6641f1-0ac4-4710-85c4-14fb049cb820	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	d38915dc-ecf3-45f6-ad3e-874212c27666
ce63a213-0f63-4e8e-ade0-68cde6796920	519d2c6f-29ef-46a2-b1b9-7f1135114aa0	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f
31253e08-2e61-4a00-8823-a992ecec4643	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f
d7803823-4de1-45cd-bb0f-f20830c7e223	519d2c6f-29ef-46a2-b1b9-7f1135114aa0	5b24f209-9cb7-47d5-81db-7334f3baf202
22acb45a-5a1f-4cff-8dea-c4614faf8826	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	5b24f209-9cb7-47d5-81db-7334f3baf202
87f69e21-9ba5-432e-ade8-4aed9e6eac72	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	bb672b1f-e08a-4019-a9b0-57f3043ed8f5
bd6a6ebd-825e-4ad3-af6f-11f1f8738811	955ca5dd-1667-4f92-bda6-ad22c1db3b91	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6
c08f8689-312a-424c-853c-10e2ce47ab21	90928f0f-3a34-49d4-921f-02ae56df3e3e	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6
885847e9-03f0-4074-9dd3-3464e6becd7f	974f6d1d-0ef3-4b6f-9652-bc44c07d44a2	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6
f1b8eb2a-9318-48a4-8092-f5055744d7cf	955ca5dd-1667-4f92-bda6-ad22c1db3b91	fb7e6310-2add-4e55-b81e-37515fe2bd76
fd85326f-9c2c-4729-9dce-b0cb5f5ac51a	8b2afa4b-d499-4ece-b16d-51c75eba9a45	91430904-7333-4c05-b42b-d693623a49ff
78f6b6c7-b6a0-4e1d-8598-5f442231035f	dbfd588e-84bb-4a9a-8e14-cd31333f58df	3489edbd-d7a0-4368-80c0-e25dff9fcad1
d7a50488-1e30-433c-a2b8-fc45911c07fc	8ec77a3d-4558-4a5d-90ff-542a12720779	87465171-dbc1-46ed-9329-82b0b0240f4d
08f3de47-4edd-4c02-80bb-5db671e89e5b	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	995e2778-542e-48b6-8c92-16284e2acfe4
10704560-65d8-434d-bf0d-524c4f941e67	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	78b74673-3266-4aaa-b18e-338e9393670d
a4a94f84-386d-4fb1-ba7a-7e0c74730ad5	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	a36fb9df-3b66-44aa-ac2f-568047295bd8
e50b4173-a3cf-425c-95b4-bec8f419ac2a	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	89633f3e-41e4-4eb8-be19-7b3181c14410
424ba377-70c5-426b-8152-516adbffbd0c	dbfd588e-84bb-4a9a-8e14-cd31333f58df	c67f6bdc-6165-45db-8544-139d1a58ae20
6dd3f5dc-e01a-44d5-90a2-499584cb83b2	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	c67f6bdc-6165-45db-8544-139d1a58ae20
88480abd-1c39-4f28-8606-24bb11f8a065	955ca5dd-1667-4f92-bda6-ad22c1db3b91	ec801b35-b819-4c27-ab57-33afc0f80f15
074df8b1-02de-4597-bf9e-69fe2debc29e	ef127419-28ee-4206-929a-6a0719171ac8	ec801b35-b819-4c27-ab57-33afc0f80f15
c2b2c264-8e4f-4fa6-bb2c-e4714a5bc619	bdc3d233-327c-43b2-9430-a24040d5de06	ec801b35-b819-4c27-ab57-33afc0f80f15
9f7a6821-db77-477e-82a7-bc49999e2857	a457000d-2255-4325-968e-d0686a4beca2	ec801b35-b819-4c27-ab57-33afc0f80f15
649fdd4c-2321-460c-8935-76738f2dae62	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	ec801b35-b819-4c27-ab57-33afc0f80f15
7d087967-438b-4454-b8ed-82df2faad1e5	8b2afa4b-d499-4ece-b16d-51c75eba9a45	ec801b35-b819-4c27-ab57-33afc0f80f15
b927547a-1351-4d38-88bb-d0cc074bff01	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e
928cda2b-3043-44b4-9f0c-0fe2c61e3dbb	955ca5dd-1667-4f92-bda6-ad22c1db3b91	55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e
12cfd876-0c98-4522-a812-f43ec961713a	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e
b586a3ff-57ac-4149-b806-f0cc09eb3658	90928f0f-3a34-49d4-921f-02ae56df3e3e	2386840a-fa2b-4da0-b7de-762506fce0b7
b2140628-d2ea-413b-97a3-74eef1f96452	90928f0f-3a34-49d4-921f-02ae56df3e3e	0994d346-efea-47e6-ac4a-ca500ebd8c5f
a844ef18-69b0-42ca-9af4-0e5988487521	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	f07c9449-4526-43d2-aec8-72c53f203dcc
c839c479-e9af-4d1b-b043-2b96811450bd	955ca5dd-1667-4f92-bda6-ad22c1db3b91	f07c9449-4526-43d2-aec8-72c53f203dcc
e95b65f0-0b35-4017-a587-0959bb06b833	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	2ba70d69-2120-4fe2-b30a-c093ebe13f68
241b13a0-e83d-4e8f-b0af-2ae5d0c6b1a6	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	06ee0b9c-a578-4e50-a717-56470e283899
8a6b89d8-f38b-40cd-b810-ac44395316d8	8ec77a3d-4558-4a5d-90ff-542a12720779	942853e6-2ed2-4011-b09c-920cfb0f98d5
4d4efc4c-b1bd-4a65-91e3-e8ef42c8c8bd	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	942853e6-2ed2-4011-b09c-920cfb0f98d5
e80af23f-53e7-4123-bd3c-8ad15cb18441	974f6d1d-0ef3-4b6f-9652-bc44c07d44a2	942853e6-2ed2-4011-b09c-920cfb0f98d5
a44a1311-1075-4835-9b06-05c1be1902d9	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	8ce99a39-f4a5-4148-92d9-ddd5e9f61c9b
152d6b9d-8604-4bb1-8377-37fe752117d8	974f6d1d-0ef3-4b6f-9652-bc44c07d44a2	8ce99a39-f4a5-4148-92d9-ddd5e9f61c9b
0e997d05-1386-4736-91be-4cf4ee59c79d	955ca5dd-1667-4f92-bda6-ad22c1db3b91	b6b20be1-7162-49d3-bb9a-e32a5770649c
b7379e9d-52f3-41ff-85f8-5eebf8051fbd	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3	b6b20be1-7162-49d3-bb9a-e32a5770649c
54450009-df7d-4326-81bd-c6b92e87d46c	ef127419-28ee-4206-929a-6a0719171ac8	b6b20be1-7162-49d3-bb9a-e32a5770649c
d260d007-ea92-4ddf-b1b1-a6724ca668c5	bdc3d233-327c-43b2-9430-a24040d5de06	b6b20be1-7162-49d3-bb9a-e32a5770649c
ac006f59-dfd1-41cd-b41d-c8811dbddbea	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	842e6e02-1157-44b5-8857-e195f516808a
76668350-3c64-4921-81e2-ac02fe71452b	519d2c6f-29ef-46a2-b1b9-7f1135114aa0	842e6e02-1157-44b5-8857-e195f516808a
61798a7c-215c-4072-bfeb-684a310717e9	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	8ff09bef-9f05-4577-9e8c-f92d6e883313
594c5aed-a644-402f-8499-050282b91423	519d2c6f-29ef-46a2-b1b9-7f1135114aa0	8ff09bef-9f05-4577-9e8c-f92d6e883313
51f2e36b-adab-4491-9560-934a71b04260	dbfd588e-84bb-4a9a-8e14-cd31333f58df	4507f475-1f14-4f9b-b9ba-196dc8bd57fb
b7a1c312-09ee-4698-a118-8d65dabc017c	8b2afa4b-d499-4ece-b16d-51c75eba9a45	759f4732-33bf-4e51-88ca-991ec52f4c15
46906884-ecc3-4ee6-8f52-93cdaf228381	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	9425ef07-2954-4826-b0f5-fdf28143a86d
55574a2e-ff90-4470-a8ff-0ecdddbf22e1	46abe54d-f275-420a-af7e-9ff3b083bc77	9425ef07-2954-4826-b0f5-fdf28143a86d
e2d01388-83f9-4745-85b7-896b73b0d0f9	dbfd588e-84bb-4a9a-8e14-cd31333f58df	c046ed7f-90c1-485b-8217-df682260b199
5272eed0-a988-44e6-8a7d-b46c35d515e6	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	aa93e14e-1009-4045-8ba5-6be63bea2035
85c2dd89-e69d-4b69-8f03-22a35a8e73aa	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	8a0c26db-1193-4f53-9568-e295dd6890ec
14aac772-5689-4e19-975b-199a30de37c7	955ca5dd-1667-4f92-bda6-ad22c1db3b91	44180603-9ea9-48ca-9d20-b4c5022884bc
b5773a35-d6ba-4949-9a50-cf72a0bc79f6	15da675b-4b4d-4c3a-a466-76ab6da7b5d5	6dbce491-e66f-4cf4-a3ce-bfbf287a750e
7c2113a7-3557-45bb-82a1-34f5fd46f538	955ca5dd-1667-4f92-bda6-ad22c1db3b91	6dbce491-e66f-4cf4-a3ce-bfbf287a750e
8df59549-1c66-498c-9a04-cb96d7d83cae	ef127419-28ee-4206-929a-6a0719171ac8	6dbce491-e66f-4cf4-a3ce-bfbf287a750e
7ff213de-0955-4a47-bc2e-c82dc8cacee9	955ca5dd-1667-4f92-bda6-ad22c1db3b91	89dc799c-08b0-41a6-b9c8-5ea9d2f3ce50
b9a005ac-a8fa-4aa3-bbb0-8bc100476395	15da675b-4b4d-4c3a-a466-76ab6da7b5d5	89dc799c-08b0-41a6-b9c8-5ea9d2f3ce50
d3572506-aef3-4723-83f9-05d06eac02b9	dbfd588e-84bb-4a9a-8e14-cd31333f58df	8ce1718d-db24-4acc-a9df-f530ff491c70
93257070-0de5-4c47-a3eb-1b2048c811ca	955ca5dd-1667-4f92-bda6-ad22c1db3b91	0105c096-8300-48db-8e1c-ff00e7b89162
98dfb876-bc9c-423c-a66f-f744d55f3320	15da675b-4b4d-4c3a-a466-76ab6da7b5d5	0105c096-8300-48db-8e1c-ff00e7b89162
50250955-7897-4953-9193-3640b87c3ec6	7dd1bd8b-3e7b-4781-8106-50df515ab7ee	aef2244f-3332-4ccb-b1ba-e4ead56633c2
26d8b621-61ee-4cde-be1a-b3c2255531a1	955ca5dd-1667-4f92-bda6-ad22c1db3b91	c2528208-bbe0-4612-8ab2-2304f1efe2ea
a7a213a3-edb8-4aa4-a560-fdbf1604a74e	15da675b-4b4d-4c3a-a466-76ab6da7b5d5	c2528208-bbe0-4612-8ab2-2304f1efe2ea
eb05b9fe-981b-49ec-8b9f-06fef22955fe	bdc3d233-327c-43b2-9430-a24040d5de06	c2528208-bbe0-4612-8ab2-2304f1efe2ea
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_activities (id, lead_id, user_id, action, field_name, old_value, new_value, note_content, created_at) FROM stdin;
d3da878d-1d5b-4f00-8508-f76a61254281	516f4bee-d9da-49d5-8558-19be6bb8f38e	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-01 18:24:58.563716
fb5b54c6-0402-4a1c-b562-5f1a0cd0cf80	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-02 03:38:27.209941
443c3911-2413-4134-aa38-f49f7b98370d	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Bhumi msll	TrueData Broadband	\N	2026-04-02 03:39:21.933673
95915926-d9b7-4f02-8e1e-5b563a2f2286	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	cold	hot	\N	2026-04-02 03:39:23.191974
7d778e7d-c280-4997-91ac-2ba079b04203	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1200000	100000	\N	2026-04-02 03:39:28.342864
a6587afc-83d2-4019-b163-f681d9b78772	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	contactEmail			\N	2026-04-02 03:39:33.620538
c4c4f5b2-b816-4f46-89fa-ef623e78a15c	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Burger King @ Bhumi Mall 2 Internet Connections required\n1. 100 Mbps Broadband\n2. 10 MBps Lease Line	2026-04-02 03:41:05.10132
18ce52c5-5c70-40b4-9efd-207f2dca63f3	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-02 04:07:19.729089
6f6a93e2-b326-40d2-813d-a080b4e068ec	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-02 04:07:19.729089
b001e8b9-9f20-4f6a-815b-b459ed9a2c2e	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-02 04:07:26.772387
afa0610a-201f-454f-84f1-dc4b2fd88c1d	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-02 04:07:29.956989
c4f03239-7e3e-46e5-b9fa-e259f4539da1	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-02T00:00:00.000Z	\N	2026-04-02 04:08:55.065667
17acb877-1bc1-43d0-89ee-afeeeddfaaa6	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate	2026-04-02	2026-04-02T00:00:00.000Z	\N	2026-04-02 04:11:07.336809
e30b5251-bd7a-4b35-b14b-f4520811834a	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate	2026-04-02	2026-04-02T00:00:00.000Z	\N	2026-04-02 04:11:12.979457
a89cb6bb-0cd0-4ba1-b781-aaf2f225734d	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate	2026-04-02	2026-04-02T00:00:00.000Z	\N	2026-04-02 04:11:20.43322
4e7d9202-4e8a-429f-9693-2dbf4ea8b1ad	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-02 04:29:06.123095
50483beb-6bad-4894-9206-14182e1e6d12	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TrueData Broadband	Bhumi Mall	\N	2026-04-02 04:31:24.203673
ebcdae82-69b6-464c-abd6-bd39679f435d	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	100000	50200	\N	2026-04-02 04:31:34.82951
e8d6dabd-cfff-422c-9de0-419d18c7dbf8	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	929946e3-0d1d-40c5-bd04-50d1606cdf35	32006777-870b-4ae9-bf95-ce0200680f41	\N	2026-04-02 04:32:07.44451
b4fe67bb-f87f-4063-afe9-eabb18809087	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-02 04:42:23.915878
00e690d1-8621-4645-91ee-cb3d7808b278	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	605c2f58-7dd4-4a77-af99-eb80f5e7405d	\N	2026-04-02 04:42:23.915878
35e39535-24ba-4374-8e6a-f17c31964719	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-02 04:42:27.807923
573b6873-1208-41bc-b035-7b675d8b3434	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	605c2f58-7dd4-4a77-af99-eb80f5e7405d	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-02 04:42:27.807923
aa9439db-ec10-4a50-a4a4-4401616e5c27	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		d8aed9b8-1b13-4206-9982-653bd01d0623	\N	2026-04-02 04:43:12.670994
a3809412-a990-4cbb-a9d2-425ff65572c8	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	\N	2026-04-02 04:43:17.160405
b6d761a9-33d8-4ac5-9fe8-de7199455a8d	b6d86451-6790-4459-8dd0-915dc697836c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-02 04:44:49.439596
6442dc1f-c407-4d64-ad0d-e16c8ad4ad2c	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-02 04:45:51.803206
895839fe-ba9a-43d2-ac29-91bfa860a26b	8ebc15b6-d903-4cf2-8096-e979dff75556	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-02 04:50:03.662455
32a98808-d127-43d3-a29d-dcbddcbaaee9	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		2fe65a52-f4c3-416b-b999-426704e830fd	\N	2026-04-02 04:51:39.987783
47ddd0df-1dc7-4a10-9e90-6dedfe44de3d	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		2fe65a52-f4c3-416b-b999-426704e830fd	\N	2026-04-02 04:51:42.813034
f97edd51-2c74-4fc8-b11b-2fb65542f7ef	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-02 05:03:32.891863
971b0413-0e68-4a70-9c5e-97d9b1d2cd23	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company		Mr. Milind Dharwadkar	\N	2026-04-02 05:12:19.433308
91e07415-2b81-45de-95ae-2a61d70cfadb	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId		1f5ae568-9cbc-4a18-a26c-de4a25dcb4fb	\N	2026-04-02 05:12:21.100059
6e955b2b-6fae-4d64-a616-447992a24d0f	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		2fe65a52-f4c3-416b-b999-426704e830fd	\N	2026-04-02 05:12:35.775136
a7dbc6b5-19da-43ee-96f4-ba5d1f64503e	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-02 05:12:44.713922
61a9d30a-dbf7-44d7-802f-77cef99569eb	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 05:37:54.063207
3502c4da-872b-411f-a382-a373fccd3916	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	2.41	24100000	\N	2026-04-02 05:40:55.243888
66410ba1-1955-4062-ae56-623db0cdf5e4	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	439kV (Open Access) either Captive or Group Captive	2026-04-02 05:45:15.835922
523ecd1a-0e0a-423c-acc6-70f17c58727d	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Pawana hospital	TBD	\N	2026-04-02 05:45:47.413217
5a903b72-a51d-4bf0-aefa-ce7f15a4be1b	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	We have considered the pricing for this @55,000 per kV\n	2026-04-02 06:10:00.443305
9e49fd1d-b911-4922-83ed-fa56162f70e7	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner	945ae736-dbf9-49cc-86bd-34dd74f5a84b	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-02 06:13:55.037181
a3c1015b-ccf4-4379-8039-f4c0f798c761	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	945ae736-dbf9-49cc-86bd-34dd74f5a84b	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-02 06:14:04.069379
1a31e6d6-bad2-4df5-93f2-eeae7621511a	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	created	\N	\N	\N	\N	2026-04-02 06:52:28.64787
1a4f6b94-1fd0-43e8-8543-dd578cf3239f	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	company		TBD	\N	2026-04-02 06:53:23.233523
0698ac6b-8c76-4a1a-a830-85f62db89e1b	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-02 06:53:43.579442
59af02f7-705a-4936-aa95-accedec18fd9	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	followUpDate		2026-04-06T00:00:00.000Z	\N	2026-04-02 06:53:55.922565
c2697bd8-5fb9-4e44-8349-5c8eb6514f35	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	nextAction		First meeting with them is scheduled on Monday 	\N	2026-04-02 06:54:19.723516
65eab00f-c6cf-4538-895f-0e7272a5355f	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	nextAction	First meeting with them is scheduled on Monday 	First meeting with them is scheduled on Monday 06.04.26	\N	2026-04-02 06:54:41.977247
0ade1e79-daa6-4f6d-9cf0-399e47d5c8b5	152d0e1f-462b-4f73-942f-cb4ec38e5c64	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 07:02:58.534008
9ec78872-2a4c-4862-a532-b84a16e53f56	116f1a8d-bb83-40f3-bba5-447560acbde8	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 07:05:59.705216
84bf5600-dc8f-4364-b1a6-cf240e023596	116f1a8d-bb83-40f3-bba5-447560acbde8	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	serviceId	e6e731ee-4067-4e3b-9c7b-99ce75838b48	bb672b1f-e08a-4019-a9b0-57f3043ed8f5	\N	2026-04-02 07:06:14.320602
933c21d3-9b48-4a0b-8047-5601b7091f73	62fea596-e175-4ae7-8245-6f49f3d20247	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-02 07:55:54.421694
6059845b-83e4-46c3-a50a-09d39085a458	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 11:44:16.980897
6906ea67-86ac-4571-bf35-e12c3c4b981b	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	dealValue		500000	\N	2026-04-02 11:44:54.818523
2e9b68f1-1167-47c4-9bf4-01e6ac0e0100	9182a748-0dbd-41f6-a516-05f94c338204	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 12:35:31.798209
37b0d9c4-c8b9-4674-a506-bab1ec1e8d2f	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 12:36:26.243876
4fd3cf85-57a6-4c42-8360-9e1165ce43a1	2c4e1555-3429-49bf-a5b9-36b12aed73c5	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-02 12:37:26.830099
46aa9c14-b156-4990-b919-567a7295e26a	b6d86451-6790-4459-8dd0-915dc697836c	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-03 09:40:44.592732
40aff21a-df7f-41b3-a35d-c3f93dc1f25b	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-03 09:40:56.270723
ca349704-9773-4620-92ac-4e133adea6d2	8ebc15b6-d903-4cf2-8096-e979dff75556	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-03 09:41:08.716986
38ab0420-ca76-4f63-bbc7-60087a4b2e71	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-03 09:58:20.777133
6c4ef764-b0ee-4456-9439-28908cff7b99	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:35:31.193062
3d4735a5-a6d7-4e79-a9f4-8d07057a0293	ab7e0e82-c2fc-4477-a087-299ae8c65603	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:36:51.927801
34ac4afa-b1d8-4cec-ad83-e7f286dd4f62	12064fa5-948f-419e-bd42-d10044009520	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:38:26.899125
7080e61d-6964-45b0-b418-7125ec6da14f	b9869dab-b405-4e79-b361-2daddbefcd27	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:39:42.174996
5c500b51-ca44-4f0d-a7f4-78ef2ce6044b	47d9efda-9857-4bef-bcf0-e913ebfe27c4	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:41:00.884062
978b3bb3-5025-4403-b3d0-2e890a7c9777	05511e65-fba0-4aaa-ae6d-6974584fd350	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:43:07.022793
e7f95e0e-04c1-418d-82c4-e0d3e5dfa999	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-04 07:45:54.92723
12b3d508-7b56-4e1b-ba42-440668f09b10	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-04 08:22:03.737154
26d240ea-77cb-4511-92c4-6c08b92e49f9	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	605c2f58-7dd4-4a77-af99-eb80f5e7405d	\N	2026-04-04 08:22:03.737154
3d35a24a-0428-4a48-abf4-a04a626748f2	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-04 08:22:08.403284
cca33b03-d1d8-432c-9d56-9a3b74757932	968bd4b1-f06d-4814-a004-6d9bf16888f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	605c2f58-7dd4-4a77-af99-eb80f5e7405d	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-04 08:22:08.403284
402fac38-6692-4847-948b-c316f65f1f2a	b6d86451-6790-4459-8dd0-915dc697836c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-04 08:22:11.027564
d0c3d1f3-b51d-4e68-b295-dd9b1200bfad	b6d86451-6790-4459-8dd0-915dc697836c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	605c2f58-7dd4-4a77-af99-eb80f5e7405d	\N	2026-04-04 08:22:11.027564
d4821d3d-71c8-43cf-9f02-f6cb420075b1	b6d86451-6790-4459-8dd0-915dc697836c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-04 08:22:14.156514
20777c96-749f-41a7-b24c-193f2d6008a0	b6d86451-6790-4459-8dd0-915dc697836c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	605c2f58-7dd4-4a77-af99-eb80f5e7405d	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-04 08:22:14.156514
71d1b96a-c686-46b7-aa13-68393a8c528e	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 11:30:36.171528
5f4d1a99-8f32-4e8c-8707-9124e556c344	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	c201795b-05d2-4c80-af2c-f90a2b7b2425	\N	2026-04-06 11:46:48.696131
b324ad2d-17a0-4b79-adce-b26b3355162b	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 11:46:54.514197
c2e406c7-2ec1-4aca-b66e-ef0efd41ef7f	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	c201795b-05d2-4c80-af2c-f90a2b7b2425		\N	2026-04-06 11:46:54.514197
c525d5cf-3533-49e9-a03e-19063fcdbfb1	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-06 11:47:01.754598
175e1b90-ecb1-4ea1-8ffc-3d47a1d2fa74	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-06 11:47:04.064566
604314b1-060a-46af-b05c-e6c0b5ce5129	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 11:47:37.511538
cf6b1bb1-e02c-4162-a183-29840b69e2ac	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	bd727ac7-e507-428e-99d0-30a0fd602750		\N	2026-04-06 11:47:37.511538
6b3dafd8-d0d7-4cde-8b88-cabfc7f244d9	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-06 11:47:43.137036
5c42f64d-1ef7-4918-9fe3-81cfcfba4a13	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-06 11:47:45.543861
1848327e-5529-452e-92e5-886abca82a78	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	BLUE STRATUM PVT LTD	Capt. Mert	\N	2026-04-06 11:50:03.982867
e842a027-31ce-4df6-9066-cfe613ddd174	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	cold	warm	\N	2026-04-06 11:50:06.336013
5d9440ee-19d5-42ed-ae16-3eb4ab44f2a0	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1000000	2000000	\N	2026-04-06 11:50:21.800118
bf151ee0-e76e-48a1-9eac-83e1f7d3c9f0	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Proposal has been sent to the customer and we are waiting for them to get back to us for the same	2026-04-06 11:51:39.487442
dd3ead02-7ce4-4f19-8e7b-8ab160ef09fc	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Proposal has been sent to the customer and we are waiting for them to get back to us for the same	2026-04-06 11:51:41.083863
0485dae3-b88b-42dd-a253-234a30783246	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Capt. Mert	\N	2026-04-06 11:54:50.089442
68286c9e-ee6e-428d-8f1e-6ff3069a2343	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 11:54:58.034162
60b47bd8-5db6-42b8-b701-c665df0cdbbe	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 11:54:58.034162
89d3ef8b-7b43-4d80-b396-45d2326f6f35	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-06 11:55:03.871116
ffbb9267-bfca-4e38-a332-c34c7dc0296f	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 11:55:09.541915
a4ff7626-b95b-4039-8a88-77e1717496ba	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	2026-04-06 11:55:12.032477
1e21c909-a49a-4698-b047-c73ff0bebebd	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1000000	5000000	\N	2026-04-06 11:55:25.085746
bfe0d568-dde7-485f-9560-0bc0d48feae5	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	- neelkanth\n- nalanda\n- Hemant villa\n- Muldeep\n- home Lakshmi\n- home shakti	- neelkanth- nalanda- Hemant villa- Muldeep- home Lakshmi- home shakti	\N	2026-04-06 11:56:56.092635
96be8edb-360a-4172-ba1b-e66b1b614eae	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Tango	\N	2026-04-06 11:59:28.861113
6c6b08a1-3144-4764-83f3-c70bcda8ff93	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue			\N	2026-04-06 11:59:31.722018
08590bca-f6fc-4eba-bd8a-dfe8aa0aee7b	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		50000	\N	2026-04-06 11:59:57.562554
5634ca5a-a520-4586-b7fd-d291c7f43adb	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	c201795b-05d2-4c80-af2c-f90a2b7b2425	\N	2026-04-06 12:00:41.128211
3f929aaa-92ac-4e65-9f25-15799ffbc7b5	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:00:44.353314
f454ceaa-bcb0-4223-be82-2393abd1d13a	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	c201795b-05d2-4c80-af2c-f90a2b7b2425		\N	2026-04-06 12:00:44.353314
16b2519d-6a03-44a1-8af7-e06b4cc95a65	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-06 12:00:47.701737
5f753d2d-c8e2-4dcf-825f-5689916590fb	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:00:50.791491
27764731-1b4b-4201-a185-7d455aac3172	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 12:00:54.517385
68f36e60-bcf4-4154-8a04-d6019adf9168	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	2eca1b84-280a-49da-a529-deeb563a9167	605c2f58-7dd4-4a77-af99-eb80f5e7405d	\N	2026-04-06 12:00:59.159437
cd54e3d4-60f7-4fe8-bc69-3d2b15efc8ea	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	605c2f58-7dd4-4a77-af99-eb80f5e7405d	2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 12:01:04.915811
7386eb03-ec44-4287-8c88-50c9ad8a4b0e	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	- neelkanth- nalanda- Hemant villa- Muldeep- home Lakshmi- home shakti	Conduct Survey and make a proposal	\N	2026-04-06 12:02:23.166565
43c87988-1ced-4877-a94c-d9655df2f642	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	38904cd1-54cf-4ac4-8722-4564e0bf957f	995e2778-542e-48b6-8c92-16284e2acfe4	\N	2026-04-06 12:07:26.149789
47fcfb46-0411-4bf9-a586-e90518b61624	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Tango	\N	2026-04-06 12:08:51.791667
d91d280a-7589-4ad0-9aa8-234d42f5d04c	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:08:54.87427
69f046ca-8cc4-42ae-9873-4d0182afa004	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 12:08:54.87427
458267c3-f143-480a-9dfe-bfd07853be41	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 12:08:57.592101
89613ced-cee4-46bb-ae01-80a608af2ded	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	- neelkanth\n- nalanda\n- Hemant villa\n- Muldeep\n- home Lakshmi\n- home shakti	Get the survey done	\N	2026-04-06 12:09:21.390014
1e94123e-ddf9-43c2-a35d-8b1ff422a5ed	12064fa5-948f-419e-bd42-d10044009520	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		50000	\N	2026-04-06 12:09:37.974139
a50a62a9-50f5-479c-98d4-a01a3325350b	ab7e0e82-c2fc-4477-a087-299ae8c65603	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:09:48.28256
11049f59-da3f-431f-8468-3c4e93a16466	ab7e0e82-c2fc-4477-a087-299ae8c65603	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 12:09:48.28256
91d07377-18f7-4123-8350-a73055d5b555	ab7e0e82-c2fc-4477-a087-299ae8c65603	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 12:09:50.842153
b11123ff-39b1-4f8f-ad7d-7563a72f89e6	ab7e0e82-c2fc-4477-a087-299ae8c65603	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Tango	\N	2026-04-06 12:10:01.382984
ef6ba7a5-611d-4cbb-8f39-a896ccb24731	ab7e0e82-c2fc-4477-a087-299ae8c65603	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		50000	\N	2026-04-06 12:10:04.343503
a8d7299b-80d0-4203-a9d6-44d43622f015	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Tango	\N	2026-04-06 12:10:37.308196
77b295c1-5039-4c1e-bbc5-264c4889177b	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		500000	\N	2026-04-06 12:10:40.885557
181477cd-fe3c-4555-b524-74da703dcb08	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 12:11:38.246839
c3beefc2-263b-4de3-a21b-81d7a90362bc	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:11:43.102738
45e24a4c-b02b-428a-83ce-e223b2eeb4ca	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 12:11:43.102738
28a3f3f1-8c12-46ef-9f29-c9ce5b4980f0	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 12:11:47.352746
6c840777-6ee1-4292-a1a3-577fa422ccc7	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction		Proposal to be sent for this and need to arrange a meeting for the same	\N	2026-04-06 12:12:08.381783
453f83a3-56ba-4ad8-abcc-df4a4fcfb504	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-06 12:12:25.888736
618247b9-96dd-4fa0-bd25-6ded2ea7d64f	094b9883-1dbd-4080-8868-5cfa97dba293	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-06 12:12:29.890924
875ab5ac-c8af-4388-bba0-f6d67c323443	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	2500000	6000000	\N	2026-04-06 12:13:03.359064
997b71a0-b5ae-4e4f-b2ad-9a551c016def	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	JIO	Need to get a confirmation on the costing for the Drones	\N	2026-04-06 12:13:33.01523
08c07c4b-0467-4fe6-a26b-d0dfeb646d1f	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Have shared the proposal with JIO for now and we are waiting for them to get back for the same.	2026-04-06 12:14:02.63734
c194722a-e101-41be-827c-b97c4f3d77a9	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-06 12:14:11.666647
edd1a337-12d3-4bc0-9af8-1f240c2d4983	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 12:14:11.666647
c6476ecb-bfca-4fcb-a906-4a22793806d9	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-06 12:14:14.181549
c09c01aa-5639-4c5d-8d4c-4d1805d122c2	7bfa59af-ab0a-4de3-a86b-d329b01ecb98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-06 12:16:41.444467
b4c7df6c-b215-438d-826e-920bbb56380f	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-06 12:35:38.371783
473f2dd6-72c0-4895-baf9-e147cbae4ce2	1636c45b-6e69-4b3e-800b-e815bd836042	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 12:43:20.294771
20053314-44f4-4475-8444-9d344c272e07	126cf547-76fc-4089-95e3-7306a46193f8	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 12:45:37.444989
6dcfc9af-ffc1-4165-b513-06c3a4b0882d	77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-06 12:46:57.134959
2b8341b9-c9a8-445a-87ba-846d140eb2b8	49492087-9f41-4f91-8a38-0e6d3267ce13	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 12:47:23.466547
b40f56ed-7f4b-4c65-ba2c-ce2187790eac	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 12:47:31.500611
513ec8c5-9f4b-48e7-8615-2bc71670cebb	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		289890ec-cc47-4d81-96cf-dcf32a4b3de9	\N	2026-04-06 12:47:33.74279
5e9a9f94-ae06-4e84-b3fa-ada8dec775ad	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	c	Capt. Mert	\N	2026-04-06 12:47:43.378445
1d74117c-c5cf-4516-8959-a5d1e96272ee	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	cold	hot	\N	2026-04-06 12:47:44.398654
792deecd-7bc1-470e-8dae-776073db9e3a	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		1000000	\N	2026-04-06 12:47:52.818906
2c5a6954-8103-439e-8c74-70789980a86e	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId		89633f3e-41e4-4eb8-be19-7b3181c14410	\N	2026-04-06 12:47:56.60085
39e2fefe-dfe9-4264-b35d-b51108cc929a	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-06 12:48:06.205451
09ffe4b9-ec29-482c-888e-0e8e42d43cde	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-06 12:48:11.525284
62da40cf-727d-4482-8b66-c5426ee0eb97	150ffcc0-69e1-46d8-adb9-15c8c213cadd	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 12:48:54.881764
262250fb-943e-48f6-9200-12399d999431	a460194b-238e-4c45-b0c5-fc3ed0808626	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 12:50:29.002652
947b4237-f0ed-4b4b-b42b-413ba05c3c77	59864d28-9491-418f-ba1d-1f0f9f53fd5d	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:02:25.912355
e02ed519-11d4-4fad-8d8f-a85834a00c3c	ef3501da-4bb1-49bb-b3b8-778208ed42a2	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:03:25.319672
5d5d7917-b45f-44c7-b17a-f7373ac8e20b	648bb18b-de29-40f1-99c7-604aa78004c9	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:04:48.508822
c49d1c0a-79e9-4959-b33b-218a2f70b286	30c4ee16-9aa3-428b-82b1-0454ce8e193b	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:05:55.568327
e7b77181-b014-4a03-bc4c-5760c6197d89	c6964247-6819-4ceb-8f32-2edff9a1211b	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:08:08.374566
3c8378d5-4ec7-472f-8d4c-13cff37ea0ad	4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:14:29.804808
75177c18-cc2c-4e1f-adc2-41285b4600af	ab7e0e82-c2fc-4477-a087-299ae8c65603	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	nextAction	- neelkanth\n- nalanda\n- Hemant villa\n- Muldeep\n- home Lakshmi\n- home shakti	Get Survey Done	\N	2026-04-06 13:15:28.747279
88800207-41ab-44b2-83b4-b20952333534	4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	nextAction		Get the Survey Done	\N	2026-04-06 13:15:51.141569
629e8b79-8795-4b13-83e5-1082f3998983	65441f98-668d-4726-b870-c41658904049	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:16:34.434459
2c4b92dd-bed4-4e4e-bf96-2a54c2abe548	467feba3-019e-42ec-8b65-78a2c2860368	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:17:20.29225
8403f734-4035-4789-913e-6345ddc88f8d	04f36275-3fa0-4ad4-aede-b47d157b0751	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:18:07.180763
70e104eb-d13e-4561-a0d8-0cc6e2e0bb0a	b392726d-5883-4d3c-ae81-c15bddc1d370	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:19:01.010668
51b023a4-5bed-4743-a2ea-5b97a643c49f	904b4017-2e46-4684-828b-e97a813a9f2e	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:20:49.370568
2ca840e6-4715-4a14-aba4-04a04d047723	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 13:21:00.56508
32b5e18d-8e39-49e0-a593-ca8498fadda8	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-06 13:21:00.56508
409f62b9-b7a4-4eb5-aa0d-dd06424ff6a6	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 13:21:03.873352
f7cdbf9e-7a1b-46b8-baa2-ed30c54271f6	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-06 13:21:07.809487
bf269c4d-f600-40cc-bd26-da4da9f4210c	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	nextAction	- neelkanth\n- nalanda\n- Hemant villa\n- Muldeep\n- home Lakshmi\n- home shakti	Get the survey done	\N	2026-04-06 13:21:20.46383
cacec040-a5c4-4e0b-8dc0-e6baa917e2fa	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:22:22.839617
fb928241-47e6-4432-a357-b133b2b2d47b	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-06 13:22:41.276526
65b3f2e6-6397-418c-b1a4-7c7efd3c12e5	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	2eca1b84-280a-49da-a529-deeb563a9167		\N	2026-04-06 13:22:41.276526
c2022441-220a-421a-99c2-d9ee99f0feef	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-06 13:22:44.835218
c7c129e5-f3b7-4a60-b68b-b4bb1cf6dbd7	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	bd727ac7-e507-428e-99d0-30a0fd602750	0b79d066-b90a-4a9d-a52d-fb29fd39585c	\N	2026-04-06 13:22:47.006976
7c8cdd85-04dc-46f4-84d7-ed5a173add7a	f232ae3a-c913-441d-8c06-21a07b35e0e9	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:23:40.356547
64ce0ad9-1fef-4376-8519-f774d6c3dda8	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-06 13:23:49.994754
f67fb7a6-a917-4ca9-9df8-9190524d5b59	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId	0b79d066-b90a-4a9d-a52d-fb29fd39585c		\N	2026-04-06 13:23:49.994754
27d3ae8b-f933-4580-849e-930e0a2fb591	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-06 13:23:52.677534
e0df5e04-f5cf-4457-a97e-9afcadd01bae	d3d9484d-9139-438c-938f-6d8781a4b1f1	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:24:48.719533
3e226aa5-40b3-42b1-b143-59dcb82b5b9d	ee9652f2-8f59-4e01-805b-1da1391ed757	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-06 13:25:31.179435
8c92844e-e476-47e4-a27b-225129ac5380	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	hot	warm	\N	2026-04-06 14:06:53.781334
c6715890-576c-4498-a637-aebd8d2cfe2d	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 14:08:56.467323
d60c9e84-2ef5-4862-8a1f-5cdda92441a8	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8	c201795b-05d2-4c80-af2c-f90a2b7b2425	\N	2026-04-06 14:08:59.996477
2df2b528-ce98-4151-b8b1-9396ad41922d	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	c201795b-05d2-4c80-af2c-f90a2b7b2425	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-06 14:09:06.063279
4246cc18-c778-4ff5-8b2f-7d05c7d28e77	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Amazon India	From LightStorm Team	\N	2026-04-06 14:09:41.368847
a9ba1a6b-c1b9-4534-b498-a7c6525e176f	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1000000	1500000	\N	2026-04-06 14:09:53.169749
d4a335b6-e787-41b2-9686-34674bc203c5	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction		Need to send a Profile of the Company	\N	2026-04-06 14:10:29.879061
6cfa22ad-1576-4444-998f-469537314439	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	945ae736-dbf9-49cc-86bd-34dd74f5a84b	3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-06 14:11:24.775719
158edd9a-a9cf-485f-8958-9f9e6e992ff0	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 14:11:30.66151
0514637b-2025-42d2-89e3-c2a35025ecff	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1500000	1000000	\N	2026-04-06 14:11:40.129456
a9da2095-474f-4bb7-a20a-985462f798df	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-06 14:11:43.54804
91f7932f-78e7-4cb1-945d-e608399897e6	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Need to acquire 10 locations for Amazon India for Telecom Shelter	2026-04-06 14:12:21.978913
f2a5b678-115a-4b36-84e0-afb84efd018e	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Need to acquire 15 locations for Amazon India	2026-04-06 14:12:55.034839
7267b062-2c34-4ddd-9fe1-77c28856479f	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 14:13:02.291066
c1e0d094-2c77-473d-a75d-5be61b3eeb33	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction		Need to send email with Company Profile	\N	2026-04-06 14:13:24.829632
480a3941-6b6b-4231-96e1-11b5672c901c	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Amazon India	Some one from the Light Storm team	\N	2026-04-06 14:13:47.772654
6b7ddea9-2859-4181-9fd5-1011dca8fc69	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	f08ee1d2-e4e2-4130-8637-b1d04706af56	3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-06 14:13:56.902448
18c04a36-3e37-4ab0-8b96-8daeeb967fb2	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Need to acquire 25 locations for Amazon India between Maharashtra Locations.	2026-04-06 14:14:55.160165
338e25d2-41e4-442e-808f-e32d9dc5eaf4	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Locations have to be between Mumbai & Hyderabad Locations	2026-04-06 14:15:54.564448
ad7a748a-b203-4bd5-8340-436ecbb07997	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	The Locations have to be between Mumbai & Hyderabad	2026-04-06 14:16:34.787222
291dc961-1167-4678-8e53-4be84af0cb48	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	5000000	2500000	\N	2026-04-06 14:27:48.977586
848fab59-7db5-4d49-a455-c9656c059c4f	62fea596-e175-4ae7-8245-6f49f3d20247	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-08	\N	2026-04-06 15:01:41.621376
d4368310-652d-4176-aed8-dc08bc1751b9	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	d38915dc-ecf3-45f6-ad3e-874212c27666	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	\N	2026-04-06 15:04:12.057942
7eced099-5351-4855-8994-f90f6c4d346d	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Blue Stratum	ARI - Indonesia	\N	2026-04-06 15:10:06.958308
1251ab95-cf81-44c1-8440-0125a4b3223a	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	Bhumi Mall	Tango	\N	2026-04-06 15:16:39.148326
5d343f1f-b4b7-4779-b88e-97a6e95ef615	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner	d8aed9b8-1b13-4206-9982-653bd01d0623	3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-06 15:16:47.881191
c4a81928-1c1a-448f-874c-95ad722106e2	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-06 15:16:55.803439
6796061b-9ba1-4245-a51e-2cf6017b86ba	bbd4221d-a22e-4ba3-99f9-d7ef13d70f88	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-06 15:20:45.100327
acd7a45a-1419-4286-a9ca-5c509492c231	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 03:06:21.536028
1d171c95-72f8-47a0-8f08-b36ed5c0b869	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	1000000	99999	\N	2026-04-07 03:08:19.725337
9a7e8a7d-eb18-4fbf-9115-4b0313a315dc	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	99999	100000	\N	2026-04-07 03:09:43.754772
cc978bb1-843a-4439-87d2-4a14c6f75c50	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 03:13:05.095794
8ac3c8cf-b9bd-4187-962c-da6f5c45c34e	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 03:24:56.307076
1cad0a6b-4a2d-425f-9d88-b12e34f11943	70c99eb8-65ca-4b28-bf94-39fde23c224e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 03:32:03.412649
ea463e61-b86b-4485-88db-13469f970f0d	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-09	\N	2026-04-07 03:32:34.486668
5983976b-60f5-4c61-8761-c5dbf928d573	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	We have to send the proposal for the same, check with Chirag sir and Shashwat sir for the same	2026-04-07 03:33:17.99124
1634c2c6-3e12-485f-9ebf-46e3a654afb3	90559f16-f667-4338-8596-d77a61b5419c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 03:58:41.331407
6ffd7513-a2c1-46ec-814c-0e475844740a	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	7000000	15000000	\N	2026-04-07 03:59:47.453292
e5b3a0db-9111-4cd9-84b0-525932f6c7e2	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	942853e6-2ed2-4011-b09c-920cfb0f98d5	78b74673-3266-4aaa-b18e-338e9393670d	\N	2026-04-07 03:59:50.795982
6523e158-7005-4392-9bca-2a9df2e11c45	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler	f25282e4-45e4-4704-bac9-01214042a80b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-07 04:00:01.134348
d284e3a1-9f1e-4909-88b3-86e249780b6e	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	Need to give 3 GBPS mixed bandwidth from TTML and Siffy	Negotiation on the proposal is going on currently	\N	2026-04-07 04:00:44.67542
e68a4fb7-c3a1-4a08-8439-c56c62b83d04	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-07 04:00:58.353954
5ea48e55-9926-443e-9173-4b9522112b23	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	3fc91a6f-aa0a-434b-868f-f39f68162166		\N	2026-04-07 04:00:58.353954
7db652dd-b2db-4dbb-885c-d9d460c3684e	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-07 04:01:01.690218
9a365134-3523-4d0d-9511-798beedf4a8d	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-07 04:01:05.462111
e15ca6fb-6d19-40b4-97fc-77601a6e7673	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	We need to put in chargers for 10 parking lots in all.	2026-04-07 04:01:24.557912
d1ffb23f-3ea8-4dad-bbb7-885ebffc3f21	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Agreement negotiation is going on currently for the same	2026-04-07 04:01:46.287339
069747ea-8a9f-4b2a-ae49-c1ac8ad705e5	feb883e7-7e03-4529-9895-874fd907b798	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-07 04:05:21.26665
3121207b-84b3-4b3d-b278-df1058ff87a4	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	followUpDate		2026-04-09	\N	2026-04-07 11:04:47.375451
574d4e4e-fc77-48da-a90f-6dbaec66843c	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	dealValue	500000	15000000	\N	2026-04-07 11:05:07.243063
9aeb7ca0-d9cd-42d0-a807-36350fd7879a	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-07 11:07:32.713124
f4e75863-1d05-40a2-8e0c-0ea9c29c833a	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-07 11:07:32.713124
e5dcb3e1-913d-49cd-993c-8207a2d11966	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-07 11:07:43.264871
dc070593-6560-4a2e-a248-34578fcce9d4	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	note_added	\N	\N	\N	Today we had a meeting with client. they want to replicate the existing ERP	2026-04-07 11:47:28.49461
b07c84cd-f487-4b5b-982e-95cc50c8f112	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate	2026-04-02	2026-04-08	\N	2026-04-07 12:51:09.749255
4626cdf0-a2b5-4ba3-8b5b-be4fe0567d7e	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	nextAction	Kenil follow up 	Take an update from the client for the costing.	\N	2026-04-07 12:51:24.513723
6ff39e1a-5443-4613-bc86-eb4797a9d70e	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	followUpDate		2026-04-10	\N	2026-04-08 13:19:28.061244
a86690f0-1cad-47ca-9be9-49506c218666	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	Our first meeting and Proposal is given today, we have identified BESS opportunity as well.\n\nWe need to check the billing again and plan the same.	2026-04-08 13:20:58.140414
a874c411-f9ea-45a3-954b-9cffa5a4e72f	90559f16-f667-4338-8596-d77a61b5419c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	\N	He has asked us to contact after 15 days, shashi dada spoke to him for the same.  We will get back to him post 23rd April\n	2026-04-08 13:22:47.812994
932dcd68-f7b3-4fcb-9650-a9da8b475a43	2df58b0f-8c32-4f2c-b404-a50eab8b1623	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-08 13:25:07.537648
1a5da65e-cf80-4329-a4a8-7337a20bfd3e	6d252cc4-433a-4f06-9bd9-73250890d192	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-08 13:27:56.1398
c28aab31-7c99-4bcc-aace-0e181c2e17fc	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-10	Need to get in touch with the client, and ask him about the content for the same	2026-04-09 03:43:15.267
2da0350f-0efa-4a51-a61b-50720ba2d38c	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-10	Need to speak to Yash for the Project execution and see the way forward	2026-04-09 04:07:23.215029
1ca2defa-54ea-4f5e-959c-569cd4cdbb8f	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company	TBD	Sandeep sir	\N	2026-04-09 04:16:27.499767
a9936585-7c6c-4e01-af85-817984aa4c02	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	48000000	60000000	\N	2026-04-09 04:23:54.083995
31f874a5-4f54-4b1a-8898-768909639b8f	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		30000000.00	\N	2026-04-17 17:24:51.337698
902f943c-dc67-44f7-bec5-dcb1c9f99207	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		18282add-4e7f-411f-bc7c-34d5ef6bef19	\N	2026-04-09 04:24:11.497079
2a5d2308-1928-46a0-98e9-db07b99560e7	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-09 04:24:22.143842
c7aeeae5-b963-40f0-aaba-464a8105be92	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-11	Work on this Proposal with B Team and make a POC Proposal and then reach out to him in a week or two.	2026-04-09 04:32:45.744937
5969dadc-58f1-4124-af32-5a3a85e9fe86	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	bd2c3618-323a-4bf5-aa87-cf4224c48185	\N	2026-04-09 05:19:17.388205
5aba821e-f13f-466d-a881-079eeeb0826d	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	2eca1b84-280a-49da-a529-deeb563a9167		\N	2026-04-09 05:19:17.388205
38514a80-08cb-488f-a184-903c425208be	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	bd2c3618-323a-4bf5-aa87-cf4224c48185	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-09 05:19:25.667074
9551091a-543f-45c6-b815-790f7d98ad29	b9869dab-b405-4e79-b361-2daddbefcd27	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-09 05:19:31.269928
86833a0b-8364-47aa-ac10-4dc336e7200a	3536b868-ba38-4482-933f-ae942e9eba9f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 05:27:45.878616
55c01ee5-02fb-40ec-a2a2-b31f33ba52d6	3536b868-ba38-4482-933f-ae942e9eba9f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-10	Speak to Amol and get back to him with a new offer	2026-04-09 09:33:09.348881
a9affabf-7eff-4d42-b8d3-79558e3974f4	b130926e-14dd-4672-aace-22cc049a0095	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 09:35:33.94086
e3bb4a0d-dd35-4900-b607-514c94133428	70c99eb8-65ca-4b28-bf94-39fde23c224e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-10	Flow diagram to be submitted and he is asking CAT 6 cable also to be added into our scope to which both Kenil and Sohil have said no	2026-04-09 09:38:44.736759
fa1c92d9-f97a-4d44-98c1-d7efa5556563	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 14:22:59.830024
5db54d57-6da5-473b-848d-dc1657f02890	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	0b79d066-b90a-4a9d-a52d-fb29fd39585c		\N	2026-04-09 14:26:28.45772
6452a56a-e8a0-4c88-9f37-583ce9368ca4	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		133149e5-d199-4829-ae26-7657ebdf27d6	\N	2026-04-09 14:26:31.1676
ee7be6af-16a1-48e5-9e60-7d58dcbe8b0c	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-10	Agreement has to be drafted and then to be submitted to the client. Zeel & Sohil are working on the same.	2026-04-09 14:28:31.904591
9e5395c7-8d3e-4ec1-819f-0d100d3e22f6	b130926e-14dd-4672-aace-22cc049a0095	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-11	We have had a discussion with the main person in the Society and now we have to conduct a survey at the location and then have to take the Proposal for them and get back.	2026-04-09 16:39:50.761382
005f04f5-793a-4969-86eb-f64eb77e9572	b130926e-14dd-4672-aace-22cc049a0095	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	f07c9449-4526-43d2-aec8-72c53f203dcc	e6e731ee-4067-4e3b-9c7b-99ce75838b48	\N	2026-04-09 16:40:15.494923
aeed7228-7fdd-4955-9f69-4512e4747428	b130926e-14dd-4672-aace-22cc049a0095	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	15000	550000	\N	2026-04-09 16:41:40.092705
200d9715-152a-4153-bd13-921dfb730339	d611930d-6919-4d47-b1b6-3fe4d7cd42d0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 16:44:55.878765
0c0e93a2-9db3-4349-964e-a64fec682306	63a40123-2216-47b7-b485-30bbc5cc7606	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 16:45:59.374868
04b11137-584a-47a4-b3ce-569b82df6425	92b6a619-2d78-4e23-bd96-e38158ee82db	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-09 16:46:47.156917
2554ad65-77ab-4137-a53c-4c7dc6bf6d59	92b6a619-2d78-4e23-bd96-e38158ee82db	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	100000	50000	\N	2026-04-09 16:47:04.500332
df8c83c0-0414-4bd3-b094-6608880dd6bf	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	The draft is sent to the customer today.. now we are awaiting their response on the same	2026-04-10 04:07:52.038316
7262d7af-7673-4f6f-ba8a-7323dea76fe0	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	These numbers have to be worked backwords.. we have taken some time to get back, so by saturday we will come up with some solution on the same	2026-04-10 04:11:41.133975
e67cf09e-2116-4382-8f6b-ca9c4c04d20d	8f850381-4730-494a-9eb7-e25bff06898d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 04:32:59.692773
9b0e7203-8921-455c-879e-8f77882575a2	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 04:33:48.217058
aa9d1614-355d-4d11-8e0b-86030b9f1a98	9d3e0877-3e47-4c65-9052-47ae7b4b5d86	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 04:37:07.187158
1eacaa2f-b2a3-4b3a-81ce-ed967576670a	e7687adb-5c42-41a9-9f29-568dbcf2aac9	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 04:51:30.634181
b5b259ca-8a34-41ec-bfd4-cdeb9cb5c435	17a6fd97-6b2d-4aee-a035-28c003cc5df8	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 04:54:33.559167
75755a4e-9426-4a6e-bc7e-442ec5e7dc9d	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 09:46:47.370144
900b1cb4-8261-4fc5-a066-1ad01a2fd1d9	90559f16-f667-4338-8596-d77a61b5419c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-25	Next follow up is after 15 days	2026-04-10 09:52:34.683113
8552a975-4ffe-4a30-8148-37ce43430fc3	2df58b0f-8c32-4f2c-b404-a50eab8b1623	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-14	This meeting is going to be in the next week lets follow up post 13th and 14th	2026-04-10 09:55:54.919239
058de4b8-36ed-4c12-af56-9cdd3a9f0ed5	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company		Shivaji Devte ref. Ajay sir	\N	2026-04-10 09:57:37.369628
c034b43b-5b69-4da1-a289-aa71e0bc6755	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId		04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-10 09:58:28.117639
63723c5d-0cba-41fe-9c85-94a14c04afbd	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-10 09:58:33.54036
69c62014-262f-458a-89d3-f33a5d2ec791	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-10 09:58:42.933294
496ded16-b0de-41a0-9a46-12dc10809923	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	2eca1b84-280a-49da-a529-deeb563a9167		\N	2026-04-10 09:58:53.158798
60fb73ca-829d-4c87-b34f-62c1bfeb0057	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-10 09:58:55.658934
3682c14c-b004-4420-944b-c7263a56fc74	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	cold	hot	\N	2026-04-10 09:59:01.114444
c19fd894-bfc1-4f2b-adea-d9510ee19925	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		2500000	\N	2026-04-10 09:59:35.952442
0a3466d0-8469-4c79-8aad-76fab72636d3	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	We will get 5 locations from Sandeep sir by tomorrow and we will put the proposal inward on monday	2026-04-10 10:02:17.970657
a8908d2d-71f9-42b3-96a8-b3f96c4d13e0	e7687adb-5c42-41a9-9f29-568dbcf2aac9	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company			\N	2026-04-10 14:27:35.029903
bcc4b26c-fc6e-4828-a96b-ff2cb0f720c6	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId		8ce99a39-f4a5-4148-92d9-ddd5e9f61c9b	\N	2026-04-10 14:29:38.133654
93b30f21-f389-489c-ba49-f89a80b8177d	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		916e4c26-2f9f-471a-8f68-9e4a287f4169	\N	2026-04-10 14:31:16.318958
0d198558-8a43-4cdb-b3b5-672320a49e68	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		916e4c26-2f9f-471a-8f68-9e4a287f4169	\N	2026-04-10 14:31:24.075678
1989ce2a-5697-47d0-8b05-306eb19a79b2	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	company		Nikunj ref. Charlie	\N	2026-04-10 14:38:49.570337
e15a4d8c-215b-41ab-905c-5cde39f32f29	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue		8249998	\N	2026-04-10 14:39:49.454432
ab5e63c4-32c4-43fc-acf4-d08b1d75708d	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadType	cold	warm	\N	2026-04-10 14:39:51.093201
853d81a5-3128-43d0-b08b-9f327ed06650	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId		a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	\N	2026-04-10 14:39:58.201894
f3daa3f9-6da1-4dca-8860-922f1535ee6d	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	leadOwner		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-10 14:40:09.257237
bb909cb0-99b5-4794-9ea0-9d65842d8f5e	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealHandler		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-10 14:40:15.08843
05c950b9-6cc4-449d-8218-3a09d4b9b546	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId		04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-10 14:40:29.82504
be89fdda-11a5-4fc0-998c-f77bfb405f3a	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-10 14:40:32.991746
06448a90-5e7d-485b-8b7b-825cacaa376c	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-10 14:40:35.713852
b90da6b7-3d5c-4445-b443-b3e2188529b8	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	8249998	8249999	\N	2026-04-10 14:40:53.319625
46817a56-14f1-46f5-9af2-98bc882683b6	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	dealValue	8249999	8250000	\N	2026-04-10 14:40:59.339338
b9c725a2-81a8-4da2-ac6f-fe02d359bb84	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	We had a first meeting with the company and now we have asked for the bills, which they should give it to us by today.\n\nAlso, we need to make the Proposal and give it to them by monday.	2026-04-10 14:44:06.127521
8dbe0b2c-2bb3-41e3-9dae-6fc7c29d1e2b	77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	As spoken to Rishikesh, we can give this demo by the end of April.\n\nAlso, we have Reena has made some document which we need to give to Rishikesh and get him to start working on the same.	2026-04-10 14:52:45.841492
82ec516f-6e46-4c38-b13a-aed144ae10e2	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	As spoken to Rishikesh, we can give this demo by the end of April.\n\nAlso, we have Reena has made some document which we need to give to Rishikesh and get him to start working on the same.	2026-04-10 14:53:45.208253
97a58fba-d80c-4c3c-b444-83cc9014ef55	77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-15	Only once we are done with the development work for ROR then we can show that to Aulivia and then she can help us with the Investment. But for now i think we should start working on the Investment Pitch deck for Aulivia.	2026-04-10 14:57:10.101786
55fc621e-52fd-4bfa-89c0-04f86ed3af99	7bfa59af-ab0a-4de3-a86b-d329b01ecb98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	We are working on the corrections, which were given by the client. But in the mean time he wants to get in discussion with the developer.\n\nAlso, we have to raise the invoice for the payment.	2026-04-10 14:59:21.223141
162a2c67-a201-4dca-bd63-68dcca7aeeb9	3536b868-ba38-4482-933f-ae942e9eba9f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	We are still awaiting call from Amol and are yet to hear from him.	2026-04-10 15:04:14.588223
0f6fdcb8-4768-495c-b135-509f3494f39b	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	We have sent the proposal to the client and now we are awaiting their response.	2026-04-10 15:05:48.962662
0389c3bb-1569-45f2-9a77-ba08d2516e49	5ac8b29a-d6b7-45fe-a007-fe1adc738640	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	We need to have an internal discussion with the core team, and then give a ball park to Apurva.	2026-04-10 15:06:59.79996
466a7c2e-d2d5-4f51-882e-d1b7a0f3af90	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	We need to submit the prices for this one. \n\nMeghraj sir and Yash have to come back to us on this one. Also, get in touch with Nitin sir and the Ease my AI team for the same.	2026-04-10 15:08:30.737673
15da6c01-acb0-4491-ae77-27860f928e2f	92b7daa3-16af-4b69-a3e6-d40ec1135b3c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 15:11:23.181152
cb5723a8-1248-4a2d-aeea-c48a0074b52d	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-14	Proposal has to be submitted to Ms. Aulivia for Investment. and have to submit the same by next week.	2026-04-10 15:38:13.379566
6a6f4ce7-271b-4385-88f9-5b1142c6af4b	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-10 15:38:39.20013
0520a237-9fed-4a7e-918e-0597b16cc788	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	c201795b-05d2-4c80-af2c-f90a2b7b2425		\N	2026-04-10 15:38:39.20013
fbf90e5c-dea9-40ab-a312-5419198dbff4	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		55c107ac-2d68-4163-95da-af005142ebeb	\N	2026-04-10 15:38:43.78835
6dfd9a04-b63b-41a3-af4b-d00defcf7dc3	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-14	Once the infra will get ready, we will start the on boarding process.	2026-04-10 15:40:15.968634
d4f5add0-451f-4587-8bd2-62a4566eb636	516f4bee-d9da-49d5-8558-19be6bb8f38e	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-14	Once the infra will get ready, we will start the on boarding process. 	2026-04-10 15:41:46.177208
ff1c45aa-68e3-4662-94c2-749698e412bc	feb883e7-7e03-4529-9895-874fd907b798	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-14	Once the infra will get ready, we will start the on boarding process.	2026-04-10 15:42:22.171955
2de303ee-29ee-4621-b106-dde04fa13154	8ebc15b6-d903-4cf2-8096-e979dff75556	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-14	Once the infra will get ready, we will start the on boarding process.	2026-04-10 15:44:00.033158
84508f9b-a35d-4c23-a0b3-038338b8a669	34187200-4dbe-4838-bd92-1cd25ab3a743	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 15:48:57.620729
71c793ee-df8d-4cb1-808d-cc0fe5e276e1	34187200-4dbe-4838-bd92-1cd25ab3a743	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId	d38915dc-ecf3-45f6-ad3e-874212c27666	842e6e02-1157-44b5-8857-e195f516808a	\N	2026-04-10 15:49:18.403785
ad04d991-ec61-4517-9919-4ef00917088e	47d9efda-9857-4bef-bcf0-e913ebfe27c4	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-15	Update from Mr. Omkar Lad: Discussing internally for specs finalization and he will revert next week	2026-04-10 15:49:57.512553
abf376b7-d6ef-4cfe-963c-c0f3b3a862f3	72de1f7f-7a50-471e-b30d-8993dafa8621	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-10 15:52:11.332525
79603794-cb27-4006-8c1c-331b36389e38	72de1f7f-7a50-471e-b30d-8993dafa8621	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	serviceId		8ff09bef-9f05-4577-9e8c-f92d6e883313	\N	2026-04-10 15:53:41.545238
3482793c-6c43-484a-b6e1-d319b124eb0b	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	Still waiting for the client to get back to us.	2026-04-10 15:56:28.649125
a7260eea-a9a3-4a86-b2b4-ad032b9772db	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-12	Need to speak to Yash for the same, will get it done by tomorrow	2026-04-10 15:57:06.687449
eb63f48b-bc39-4aba-9058-edc466ce1480	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-13	We have given an agreement of 39 pages, so now we are waiting for them to get back to us with their inputs	2026-04-10 15:59:07.63989
f15e63d2-8fe5-45a2-a9b7-050fe7949339	70c99eb8-65ca-4b28-bf94-39fde23c224e	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-15	Once the infra will get ready, we will start the on boarding process.	2026-04-10 16:00:40.525479
ea923120-7443-416d-aeb0-3e570290e397	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-10 16:01:34.482986
2933e342-8bdb-4d6b-8cc9-3c7a6709934f	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-10 16:01:34.482986
b06fa1fb-cc03-47ce-a5eb-573b1a5a66cb	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd2c3618-323a-4bf5-aa87-cf4224c48185	\N	2026-04-10 16:01:49.984617
7c27bac7-9b95-443e-98dc-ae4e42189dd2	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStageId	bd2c3618-323a-4bf5-aa87-cf4224c48185	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-10 16:02:02.119758
76d3fbbf-f3d0-4add-adad-369e3c63045d	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	field_update	pipelineStatusId		133149e5-d199-4829-ae26-7657ebdf27d6	\N	2026-04-10 16:02:06.093554
99be4982-21cf-48d6-86e1-80278295b818	c9988da9-d34c-4ce7-8631-b0134dec6a17	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-11 06:54:04.020688
3b31bdcc-c516-4a26-beac-a427c347ec18	e2ca0c09-4118-403e-8c74-21d8b2ab7e93	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-11 13:24:54.961526
cce1b7e0-e7d4-471a-bb61-7e8a7e39b34e	0d2418e4-e6f8-45f4-8089-2b08e485baa8	6f65730a-b2a4-475c-9ffe-45f4f7347b97	created	\N	\N	\N	\N	2026-04-13 04:06:29.350318
41051dcd-f1be-4f7a-98af-e6a9a9202a98	0d2418e4-e6f8-45f4-8089-2b08e485baa8	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-16	We need to send them some kind of 3D model of the drones, and he further wants to connect us to Rajnath Singhji. Shashwat sir knows all about this.	2026-04-13 04:07:31.503621
c79e57d8-e454-4917-b618-5a473210fbe1	9c4532c2-3192-4d0e-ace3-98f7122d0e0c	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-13 06:07:13.445563
808e7792-4dc9-4b70-8de0-d68f8632d543	92b7daa3-16af-4b69-a3e6-d40ec1135b3c	d8aed9b8-1b13-4206-9982-653bd01d0623	note_added	\N	\N	2026-04-15	Tomorrow Dr. Bandhan Sir has meeting with RVNL	2026-04-13 06:59:55.072889
ef277083-4cdf-431c-ad0d-05d77482260f	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		b6b20be1-7162-49d3-bb9a-e32a5770649c	\N	2026-04-17 17:24:58.720814
67f030fe-5f8e-4a16-a3e2-93643b0a2798	34187200-4dbe-4838-bd92-1cd25ab3a743	6f65730a-b2a4-475c-9ffe-45f4f7347b97	note_added	\N	\N	2026-04-15	Today we had a discussion with Ritesh Bhai from the Ahmedabad and we have asked for a revision in the rate to INR. 4.10/- per unit.\n\nAlso, we have understood that we will be doing 50% DC loading and also have to give 3MW BESS for the same.\n\nFor now i have asked Ritesh Bhai to give me an Scope of work Terms for both the parties. And then we can move forward and if we needed we can meet in Jaipur on 16th when I & Kenil are travelling there.	2026-04-13 13:36:45.961172
1a19c766-8ce3-4e52-8b79-c8ba68925e41	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-16	Tried reaching out to Chirayu sir for permission if surveys, but no answer	2026-04-14 04:09:36.849974
2a61ce37-519d-4b06-a37c-ae4d58c3105f	6d252cc4-433a-4f06-9bd9-73250890d192	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-16	We have to meet Raymond and understand the commercials and then get back. Next meeting is scheduled for 16th.	2026-04-14 04:18:48.862765
a88ce1c8-7066-4cc6-8fa2-7c7a436c4090	2df58b0f-8c32-4f2c-b404-a50eab8b1623	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-16	We have to meet Raymond and understand the commercials and then get back. Next meeting is scheduled for 16th	2026-04-14 04:19:06.58024
dc67af0a-225d-4b5d-9db1-c87f7df273d0	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-16	The client reached out to shashwat sir but we could not conclude and today the client is not receiving the call.. we will wait for them to get back. 	2026-04-14 04:20:16.519601
5fc15bfe-0d1f-4843-a27d-b0e85d4c9fa3	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	note_added	\N	\N	2026-04-16	Apurva sir will discuss with the Client about the software application	2026-04-14 06:18:02.656231
3e666030-3cb0-4603-ab48-1ca669cd3ae4	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 09:13:52.705837
66f73ad8-dfc4-4bb8-be40-74e4b05d5d30	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 09:14:34.796085
afa65ac0-679c-437c-ac9b-151855d06081	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:07:05.408808
e2d31586-01e4-4f28-b438-2213a476255c	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:08:16.350846
149a9a24-2a95-42b4-b24d-c66f9a4b51b1	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:09:03.36606
68c2a530-b5e0-42c4-9ee3-6aec8cab2c92	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:10:47.024149
9603ea43-bc39-4cea-b63c-2de83e9a8379	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:42:17.135905
ad5bc12a-dd61-4676-9e03-1f9f05e86f63	d066598e-e4d8-4bf2-94af-498f161a337d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:43:16.389777
4355c881-9469-4057-9ea5-185078f84281	dc016f34-4d8b-43b4-be65-eb6060f8cb43	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:46:43.783028
fd4b6510-2538-49ba-b347-097853be3162	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 12:47:27.790332
5fe5f05e-ec49-4baf-b160-2bf3dc8d0a83	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 13:04:20.990915
bed115a7-5c26-48cf-b1a6-e0b7f034fc8a	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-17	We had given the costing to Capt. Mert, but we took a lot of time to take the costing from the vendor and to give it to the client. \n\nBhandarkar sir delayed this a lot and in the end the customer really lost his patience with us.!	2026-04-15 13:07:49.205387
108eb28b-e19c-492a-8fe2-b6df058d0d4c	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd2c3618-323a-4bf5-aa87-cf4224c48185	\N	2026-04-15 13:08:41.455063
fa48156d-7999-4b85-8f31-ed22762b88a9	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	3fc91a6f-aa0a-434b-868f-f39f68162166		\N	2026-04-15 13:08:41.455063
2e029b8e-7d3f-4b08-b7aa-0b342da0ff24	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		5c7631b4-d245-4a98-b861-e610c69e0c10	\N	2026-04-15 13:08:45.24927
c5d5175e-37d6-4180-a49a-d438a6e9c697	9841d159-eabb-4cca-a5e7-838a3424c763	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 15:35:12.286465
ea58f915-93de-4b71-acd1-a9747e42ab5f	aec25480-c9b3-41c6-8201-0b5cce2c6731	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-15 15:41:16.531297
7e4d63fb-ccaf-4377-b671-1cfae570f9a8	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 14:03:52.928995
39cfce53-3a2b-4961-aa34-6231f5201cfe	fb8adc33-72fe-4a21-aedf-56939d0252a7	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:34:22.720225
f2c312f2-100c-43a4-81f8-9b6eeba5ffd2	7ec4a9c9-cd12-4747-83f1-a9e15e3a08a7	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:34:50.088956
91813ad7-fcbe-42f4-b45e-81eaee2ee1e3	638fa2a2-6e07-462c-a2b1-223bad1c41cc	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:35:44.067492
36a5680c-02ca-4699-99d0-67eeaed77ca3	1eb66b8e-4751-4379-b459-7baf72c83d75	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:35:55.289276
7c1b8a36-e9d0-4a51-b11c-0d470ffec72c	cb2f7179-3f4e-4526-8305-1432c98526b4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:36:46.403101
5df24c73-f7d9-4afb-8441-0c84b6865aed	b1897ee5-021c-41f9-8335-2aaddb7744c5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:37:00.807844
e1f6f76c-3f13-41cb-ad83-da4e1d784483	74883637-2831-4ef3-a58f-e169276c0dc8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:37:12.799738
7f0f7632-37c6-4818-8106-c27acd1e4c29	d07cbc73-56be-4410-8b8e-92e4ee8d755e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:37:22.710714
bc116b4b-d501-4fc8-9d83-dd80e7638ac5	003dae3a-7633-4615-a1a9-182e7c162620	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:38:28.121511
8a5708dc-822a-44a9-9909-e548ecf7fa86	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	\N	2026-04-16 15:39:17.021601
7dc24470-72c8-4a7f-ae4f-563a3ad441e0	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-16 15:39:33.694227
5dc490e3-c92b-47b2-a7c4-45a6bc8aad64	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-16 15:39:38.757201
de244f59-21d9-4aef-b929-f12241bad82e	ad749e5e-173b-4ba9-ae0b-ac37d8b4d84b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:40:38.020476
c0539cec-ba4e-4bc4-a6c2-c5cde7b01f4d	947522b5-7459-4bf9-9dc5-5a6ed2153c91	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:41:16.20491
0e455976-61ba-43cd-9094-187610d497d1	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:42:17.015442
c1db3436-e273-40b8-a9d9-7c6df9bce439	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:43:04.79959
864a9b86-a376-4da9-8132-5b0bcc0286e8	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:43:15.850237
fa413755-c2ab-4e1a-8609-748e0989dbd4	22fa24eb-38ae-4efd-b49a-e7c1905d891d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:45:15.820997
cfe6de14-54c9-4e1c-976f-ebd504281359	733a2cbb-18c5-4776-b394-e71308028c23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:47:12.120634
03418d20-0e6b-407f-a5cb-07c5c47361aa	bef3049b-d18e-4e71-bb91-cb01d1193eac	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:48:45.853992
2b5f803d-ef04-4d46-ad99-29cf8ceebe8c	aeb87c95-35b0-4d8f-9236-bedd3d2c17e4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:50:42.01955
d7f21360-6e5e-4509-8759-73d8dc198e9c	4fe8b176-1cba-489d-a494-b7c73a4c45aa	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:50:59.42963
72b943f6-ed81-49be-ba2f-e18ebff7533e	38f0b924-cbe9-4aef-a8b9-0b355a785f54	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:51:40.409537
4da2147a-8da6-4bad-9628-25b7a8d3cd9d	e936f816-ab67-455b-9632-68becc921fc4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:52:10.703169
094ee5a4-0f17-47f4-ac94-5ac0cff1fe46	f5bc213d-ddf9-43f9-bf9c-130a56c53a53	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:52:34.760319
9a4ea0fa-28c2-4619-8958-6fda0b8fdc0e	f004884c-3a2e-4b24-b6bf-7fe71e92f3fd	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:52:49.010831
73b7e4cc-d8a3-4323-8a65-0cc829f2e531	9f98e525-e6d3-40f3-9139-558a4094fc90	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:56:48.382986
67ec1014-f541-4614-9734-5ccc6fea7c78	118439f6-8c92-4b1f-a531-5e22fbfe8dd9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:57:50.86981
981570ba-eb8a-4feb-9776-e21b8fceabd1	45bf4fde-465b-4d31-815b-e31d7fe9d0e4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:58:24.921991
90bd0af4-fff8-420c-b97a-caf552616b74	69c8a138-ff83-4d1a-890f-1472e596e08e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:59:04.947679
4df24a94-cfb0-40d3-a215-3ab8e7c423af	aaf28eca-9e53-43e3-9da1-c1b653fa5a09	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 15:59:52.091842
5ffbd4ae-bec0-4c46-96d2-4cf7a431af7a	c4bb6605-fc77-4508-b63d-80a08b12cbbe	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 16:02:08.057813
8a47438b-1981-452f-bc91-70ce79428149	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-16 16:04:34.697494
e65ff1e3-40f1-4f63-bdf0-60e4caa88b99	6baaf530-8d70-4279-a904-a759a773f176	d8aed9b8-1b13-4206-9982-653bd01d0623	created	\N	\N	\N	\N	2026-04-17 06:42:58.799593
619d3e42-e547-48ee-9f5b-4d786724c714	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Have to speak to the client and ask him to send us the layout of his site for now to start working on the same.	2026-04-17 11:30:08.859514
0e223f50-1a0f-4d13-b491-05fc3960dbd1	97c58426-102a-4aca-a632-9cca4c645c89	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 18:35:08.336879
5a55b090-9d3c-4d0c-b175-1076d8b6821a	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-18	We have to find the Multi Party meter suspense from our sources.	2026-04-17 11:32:04.875026
c3dd7b19-99ad-4c67-af28-e71b241af0f5	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Tambde Sir Friend	\N	2026-04-17 11:38:35.02621
0381ebf0-94b3-41cd-acf4-3a9063200dc7	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	warm	\N	2026-04-17 11:40:06.953364
239e9dd1-8504-4bfe-a004-c61befeea10e	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		149999	\N	2026-04-17 11:40:14.04817
3dbebef1-5edd-4d3a-b5cb-60e39f3886e2	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		06ee0b9c-a578-4e50-a717-56470e283899	\N	2026-04-17 11:40:22.001114
4a481bff-3b4b-4598-a358-61efb822f601	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		18282add-4e7f-411f-bc7c-34d5ef6bef19	\N	2026-04-17 11:40:32.454099
ba7be4a6-304e-4788-b130-05953d602fb7	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		2fe65a52-f4c3-416b-b999-426704e830fd	\N	2026-04-17 11:40:37.605368
d211a774-cf1a-4397-814c-4b74a61b2b6e	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler	2fe65a52-f4c3-416b-b999-426704e830fd	1915618a-38c5-4473-bef8-765a5555d3f1	\N	2026-04-17 11:40:51.356439
8119dfff-564a-4943-a162-e8c73db586a0	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Spoken to Tambde sir to get the layout and everything around the same.	2026-04-17 11:41:16.563957
96f7b762-610c-4608-a296-7c0c8c290972	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Tambde Sir	\N	2026-04-17 15:48:35.134398
a2f56a07-68f8-4dbd-9211-8ea109af87d6	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	warm	\N	2026-04-17 16:13:06.317805
473b0221-3260-44dc-9edf-0060afe0b16a	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		500000.00	\N	2026-04-17 16:13:17.545113
b0c2a1a7-bf7f-4fd5-82b4-abb183d0a8db	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		aa93e14e-1009-4045-8ba5-6be63bea2035	\N	2026-04-17 16:14:24.38536
00ec1b2b-4b87-4a4e-b0c0-2261abfdd0a4	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		18282add-4e7f-411f-bc7c-34d5ef6bef19	\N	2026-04-17 16:14:43.60854
5573601f-0cca-4c5b-b124-60de731fe7f9	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-17 16:14:46.215441
12c2e129-d813-414d-b3ff-55638ebda48e	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-17 16:14:51.229826
80c18e69-7d7f-4320-8b76-0458cc3fb34b	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 16:14:55.116353
8c84024c-adbe-489b-b87a-319ea3795821	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	2026-04-17 16:14:58.127023
61fb0741-f880-4f01-a7cf-b5799c8ad46f	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Getting in touch with the MSEDCL guys to get the Connectivity is there or no for the same Sub Station. \n\nThis work will be done by Tango. The co-ordinates have been sent to Tango for the same.	2026-04-17 16:16:06.649636
71a753cf-7f81-4772-a005-2666640a9f24	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue			\N	2026-04-17 16:16:32.456397
0607e067-40cb-4aac-95a7-4f9e3bed2bc3	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	warm	\N	2026-04-17 16:16:34.732083
b31aa035-e4f7-410a-9e85-3e673755e36f	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	warm	hot	\N	2026-04-17 16:16:35.496604
1f14d751-75c5-46d1-860b-8b19bf95da11	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		10000000.00	\N	2026-04-17 16:16:55.723372
5336d514-6647-4805-963a-f26e366d6494	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 16:17:33.782969
12278f07-3a4f-43f8-8d7d-2b3d1ed5b4d1	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-17 16:17:36.446286
27e1e12c-6af6-4cce-bf53-f6a74cac7b9d	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 16:22:35.679158
770d8654-35d8-4237-a94a-09fd78baec1f	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	2026-04-17 16:22:38.742303
92348119-ab0d-46c2-85e0-b86759e75dc1	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 16:22:45.329409
cb400338-be8e-44c4-afb0-a5cf11740048	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 16:22:50.000282
aba4ec64-203b-43e8-bf46-6005fdeb1d03	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-17 16:22:54.183736
ccbf1182-6f79-49d2-ae24-4594954f8697	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		2500000.00	\N	2026-04-17 16:23:09.69839
f851b8e3-7588-4991-9e20-c8381edfdc49	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		2500000.00	\N	2026-04-17 16:23:30.580958
afc9b909-864d-4c2c-a265-d1a5ce4fdc33	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-17 16:49:26.841055
f43324d3-73c3-4cbe-96ce-76e1a7778b3a	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 16:49:34.964147
f4c00d0e-3a0a-4d74-a895-d8b9d0084a84	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-17 16:49:37.055253
0b8d0382-1cd1-4cd0-a52b-37a75702c6aa	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-17 16:49:48.687295
77223749-08f6-456c-8c58-186f07657137	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		1800000.00	\N	2026-04-17 16:49:56.960149
a223ab1e-faea-4314-8d1b-f08e82763698	35f080db-23b6-4fa7-912c-f1956d9d40ee	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	1800000.00	18000000.00	\N	2026-04-17 16:50:07.618152
c06f3626-7191-4c00-a14a-1dce50cec0de	679d5f91-d1f0-4032-b902-32fefd074e7e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-17 16:51:40.891708
6c209043-e52c-4c3a-bf5b-1a34a54bb8d6	750770aa-eea0-4c1f-916c-42ca19b30bb1	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:04:07.810887
e40d5158-f0ef-48b6-a804-92f9e38f4de5	0f7918e3-5203-46d9-b7fb-cd922d22c93a	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:08:37.328345
089526e2-cfbb-493d-8fe4-99db56f7a395	24d15bb7-20b2-4997-8b09-5b7a2ebbe792	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:14:54.955628
9affe647-d7cc-47b7-8332-77532df5bdfc	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 17:14:59.990674
f0d5d3f4-9c13-499c-b1ba-f2f00a7a2191	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 17:15:03.488481
bcf3c277-4cfb-4aee-8ec9-6f36f2e58089	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	2026-04-17 17:15:06.315049
31031f6d-90b2-48ac-b140-d43c0c3c169f	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		50000.00	\N	2026-04-17 17:15:17.432331
217c857a-66f6-40d2-9fcf-5e7df06d5ba3	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		995e2778-542e-48b6-8c92-16284e2acfe4	\N	2026-04-17 17:15:26.558545
d39fb335-adec-4565-87af-5100301e1a90	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		dfdbbede-0a61-4ff5-855b-58f2e05c5dda	\N	2026-04-17 17:15:39.534077
47a7e107-743d-4ab1-9ba1-c5ff8399d890	823d8a28-e746-4023-88f5-1658d8e931cb	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-17 17:15:48.155221
c607fab3-1742-47cb-b20e-d7f4bb07ba7e	24d15bb7-20b2-4997-8b09-5b7a2ebbe792	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	dealHandler	6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-17 17:16:26.497929
5f0608a1-e1fe-424b-a813-992ab60145c8	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Kapil Bhatti	\N	2026-04-17 17:23:58.895627
84d216bc-96cf-409d-b0d3-4e0675437498	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	warm	\N	2026-04-17 17:24:40.903676
99a79ec5-3389-4730-8583-7308a89ce124	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	warm	hot	\N	2026-04-17 17:24:42.244911
45bd97c3-14ea-470c-bd96-3848cf1e0134	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-17 17:25:13.170339
6cce086c-5aa3-4c12-a166-bccae3ed11f7	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		d2218768-ed36-496d-86fa-34ae48a66111	\N	2026-04-17 17:25:19.909726
ec1210cb-7877-4ed8-bed4-2ffa57dad884	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	We have sent the Tender Documents to the Institute, there are some punch points which are pending. But for now we have sent the files and now we are waiting for them to get back to us.	2026-04-17 17:26:21.919207
b201e366-363f-48e1-a256-5237d96d95cd	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 17:26:49.81376
fb080b8f-50ee-474c-be6d-878386715aed	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-17 17:26:58.028247
100be2f2-1918-4aa1-a134-0189d21039dc	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-17 17:29:05.669546
f5bc4197-762a-4ad5-bc45-3939deb410e8	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	We have sent the Tender Documents to the Institute, there are some punch points which are pending. But for now we have sent the files and now we are waiting for them to get back to us.	2026-04-17 17:29:23.516352
c9de56b1-8289-43e8-858b-19733ae5961d	24d15bb7-20b2-4997-8b09-5b7a2ebbe792	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	To sign the documents which have come. \n\nWait & watch	2026-04-17 17:30:45.607247
451d57b7-2209-4280-a9a8-d4dde84eb570	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Vodafone Idea	\N	2026-04-17 17:32:37.097197
cb807cd1-a84f-432d-85e9-55f2b8ae24ee	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		10000000.00	\N	2026-04-17 17:34:25.152457
47603a97-1e1f-4f27-9ba5-c42942bd2ee9	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-17 17:34:27.11768
83c56612-8ece-409b-84ac-8fe19bfda20f	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 17:34:32.051083
70c57f7b-f503-41a8-8b9d-fb2e1fa780d4	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		289890ec-cc47-4d81-96cf-dcf32a4b3de9	\N	2026-04-17 17:34:34.347492
ac700279-3b84-45ca-bb4d-92e973e69f76	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		8ce1718d-db24-4acc-a9df-f530ff491c70	\N	2026-04-17 17:36:04.186661
5596ed17-6253-47b5-9c22-a605a83e190f	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-17 17:36:33.956641
17fd317d-e31f-4ac7-aeed-7747fd4bc0ed	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		9f0afd4f-fea4-4740-bec1-8e39d33a988b	\N	2026-04-17 17:36:38.478594
195de10a-badb-4b35-8a8f-745283a37a12	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-18	Project work is on the way, we are putting a partial setup with Solar on our own Trackers on the Building for the 50% consumption off taking. In next week we will be achieving the same.	2026-04-17 17:37:42.895759
d0cca7ff-5ecb-4053-a09b-da772e2a2e06	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 17:37:54.431017
b0826ba7-97c2-4936-a68a-237fc48220b0	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-17 17:37:57.947989
97579538-8150-4fca-b604-fe53f1bd7258	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Divij	\N	2026-04-17 17:38:14.474363
23a3940b-9084-472c-b016-3afcdc275a32	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-17 17:38:55.941686
0a72cbaf-3f0f-4cb8-83c8-dc31624b3663	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		999997	\N	2026-04-17 17:39:03.082578
6ce619d9-f66c-43a9-89b7-7edb0517ce74	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		b6b20be1-7162-49d3-bb9a-e32a5770649c	\N	2026-04-17 17:39:05.726312
eb995957-96a3-4f30-ac3d-0ad5d9d46830	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-17 17:39:14.886769
180626de-bf13-4fd0-83cd-401f4c7db1fa	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-17 17:39:18.843097
88a2147e-7ab0-4108-9d1a-2c6f401b9da3	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	We have already one the contract. But we are trying to win the contract by giving developed application using AI and not out in house resources.	2026-04-17 17:39:53.623623
b9d657e9-9da7-4df6-9026-19eec58273c5	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-17 17:40:45.95884
00855799-297b-4cda-8f2d-2dd07f20d1ae	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-17 17:40:45.95884
86ca8e8c-ab75-4991-9d58-390aacc81294	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-17 17:40:49.743521
d54f4449-bd43-4096-9b9c-28a6f39a8fd1	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	1000000	400000.00	\N	2026-04-17 17:41:01.605946
20df20d6-4bf9-4d06-ad12-4eb9497f8243	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-21	After submitting the quote to the customer. Customer has said the quote is very high and hence they have shelved the project.\n\nBut we will reach out to them again in the next week and in the mean time we are also trying to get another quote from another vendor and try to close the same.\n\nWill have to take an update from the Chirag sir, as i have asked him to speak to Bhavik to get the costing little down and have also asked Shashwat sir to ask the client what is their expectation for the same.	2026-04-17 17:45:49.10312
b03f0538-1c7f-4024-a90c-119632a1fd6d	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-17 17:46:34.993923
4910e8a8-7d94-4584-b431-3b5c4db9fa35	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		289890ec-cc47-4d81-96cf-dcf32a4b3de9	\N	2026-04-17 17:46:37.605924
c9bb0830-fb50-4b24-ad13-e4d110449a4c	b59f8570-d8f3-4c21-8572-bbd9ee5c2ae2	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:46:39.091831
6b7286a3-6c75-49ad-b782-b08393825407	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	289890ec-cc47-4d81-96cf-dcf32a4b3de9	55c107ac-2d68-4163-95da-af005142ebeb	\N	2026-04-17 17:46:39.29003
b83b419c-fa36-4534-b832-112d57c4f5c7	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. 	\N	2026-04-17 17:46:51.417951
a8e92fde-dd44-4444-9c53-91ca034f4296	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	warm	\N	2026-04-17 17:47:08.447168
615b1c98-c4e8-4f0e-a3ec-d707b0a37e28	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		100000.00	\N	2026-04-17 17:47:14.675549
b38ceef6-c722-4808-8380-ec19096bba8e	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		89633f3e-41e4-4eb8-be19-7b3181c14410	\N	2026-04-17 17:47:19.39193
eeabc824-a3d0-417d-9a09-2c6c04a9e059	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-17 17:47:30.518739
804a9527-4fd1-44a2-86ec-d8eda72fe39d	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-17 17:47:38.28661
2cfdd7f0-eee5-4adb-b7ff-f530ab6c0c98	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-18	Need to follow up with MEghraj sir and make Proposal for the client/ Investors as well.	2026-04-17 17:48:19.089476
2922a8a3-6321-484f-9cce-432403e57518	4264ecb0-06f9-466c-a130-35b04dc7d437	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:48:20.604956
579bbacd-45ea-4379-aead-242558739495	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:51:03.373709
53c4fcc1-8958-4155-b790-0505937639a0	08032964-787a-4e78-ae29-8e5381ed12c8	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 17:56:01.336609
0f1dd351-1959-4296-af57-928c9e5d644e	3cb1c833-b7af-4317-b47c-7d49440ee68d	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	dealValue	999997	1000000	\N	2026-04-17 18:16:11.057114
09406fd8-971b-45ff-b829-32c0dd62724a	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	1000000	1000000.00	\N	2026-04-17 18:16:27.316864
1d3c1164-b75c-4f0d-aa36-847e1bf3226d	0e9325bb-c08e-4b20-b774-494ffdd4b1b5	f08ee1d2-e4e2-4130-8637-b1d04706af56	created	\N	\N	\N	\N	2026-04-17 18:18:18.923005
f49c3092-4508-4fa1-8ad2-52e96d101e16	b9869dab-b405-4e79-b361-2daddbefcd27	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:39:41.833114
343870a0-f4e6-4975-a9b2-5a9ccd492d35	12064fa5-948f-419e-bd42-d10044009520	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:40:01.189973
81474685-febb-43c0-957b-b59c84109b30	ab7e0e82-c2fc-4477-a087-299ae8c65603	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:40:13.682043
53419048-b47b-43f1-bcec-abd6fb4cd695	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:40:27.465984
7a6ca18b-1778-42ba-921d-e4a5cea96d0e	bbd4221d-a22e-4ba3-99f9-d7ef13d70f88	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Need to get in touch with Sohil for the same, remind me tomorrow and i will get it done.	2026-04-17 18:40:59.246501
49212a4b-cd0d-481d-a9a1-c3479fcf5bfe	ee9652f2-8f59-4e01-805b-1da1391ed757	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:43:52.929252
cb62a3b1-3a69-465e-9532-e5276c3b3c56	d3d9484d-9139-438c-938f-6d8781a4b1f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:44:06.205118
66586cc2-dbca-4f05-9e7c-023af09952c4	f232ae3a-c913-441d-8c06-21a07b35e0e9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:44:16.127691
8ab581b8-f8f1-4f17-9671-b2c18dac9cfa	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:44:42.312779
16f2724d-64da-48b4-96dc-76334c6234f9	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Need to get in touch with Gagan for way forward! the current pricing which has come, basis that it will be too difficult to close this.\n\nWe can also order the item from China and get closer to the Delivery for the same price.	2026-04-17 18:46:23.766012
55a20202-bf7b-4521-810f-9bbca2db50d7	904b4017-2e46-4684-828b-e97a813a9f2e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:49:14.610686
b9b4f7b9-daaf-49b2-a6f0-6c498933adf8	b392726d-5883-4d3c-ae81-c15bddc1d370	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:49:24.586561
272a7c47-3ef7-488a-a82a-971b97004b32	b392726d-5883-4d3c-ae81-c15bddc1d370	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:50:19.548344
a0010fee-8260-416c-8b8a-d8f1e44138f1	04f36275-3fa0-4ad4-aede-b47d157b0751	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:50:38.611684
4935e963-3e5f-448c-9b53-f9a5d9981b2f	467feba3-019e-42ec-8b65-78a2c2860368	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:51:34.285497
32075fd8-f6c2-4a50-8151-e756d75464dc	65441f98-668d-4726-b870-c41658904049	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:51:43.365064
c80e8dd7-1bdf-4b3f-8673-e1f9c8894d61	1636c45b-6e69-4b3e-800b-e815bd836042	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:52:06.999136
045f2ba8-066b-4b3f-b2c6-20c6ae75a8c1	126cf547-76fc-4089-95e3-7306a46193f8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:52:16.40933
15ab47cb-dcc4-4e44-83a2-0f5043411d60	49492087-9f41-4f91-8a38-0e6d3267ce13	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:52:24.039354
56a7528e-406f-4768-96dd-531e5b065a4b	150ffcc0-69e1-46d8-adb9-15c8c213cadd	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:52:31.948509
fbbff1ce-5edb-4bbf-af07-43236a77bc23	a460194b-238e-4c45-b0c5-fc3ed0808626	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:52:44.05042
de7e2aa0-7fc0-4eeb-b9f7-65ac5725739c	59864d28-9491-418f-ba1d-1f0f9f53fd5d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:53:00.659455
ab4aa34f-777f-4b2d-a178-7bb8ac310d8f	ef3501da-4bb1-49bb-b3b8-778208ed42a2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:53:10.684398
e09b05f0-5434-4408-8c22-186bdbfe84c2	648bb18b-de29-40f1-99c7-604aa78004c9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:54:12.535538
1f8928fc-5379-409e-abdb-69292b176963	4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:54:21.968078
c6b975c2-cfdf-4ebb-b448-d934cdb465a6	c6964247-6819-4ceb-8f32-2edff9a1211b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:54:31.083256
21fb6f69-d0fa-4388-84a4-0a86523ce9da	30c4ee16-9aa3-428b-82b1-0454ce8e193b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	2026-04-17 18:54:41.010276
d6d48db8-dd90-405f-ac31-cb7515c67606	d9eec539-ec45-4733-9991-fa85691b0f4e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-17 18:58:36.817777
66d1888f-25e9-4fe1-9c7c-4f3d0ef39684	bdb3a7c1-12df-4f09-9943-a0bafaf2a69f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 09:26:40.361605
c751b9b0-3c63-4b8b-ac3f-7a9f0b97adf5	47d9efda-9857-4bef-bcf0-e913ebfe27c4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-21	Gagan had a word with Omkarji for an update, but they are saying that they still havent gotten an update from the top bress for cost confirmation.	2026-04-18 09:30:04.184677
78d6df44-837d-44c1-953a-b6954d10db8f	8ebc15b6-d903-4cf2-8096-e979dff75556	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Waiting for server room and wire work which needs to be sorted. I have asked Kenil to send an email to them and keep everything on emails	2026-04-18 09:32:51.32427
382ed88d-ee23-4656-a36c-b9143d88bd31	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	Waiting for server room and wire work which needs to be sorted. I have asked Kenil to send an email to them and keep everything on emails	2026-04-18 09:33:13.812073
3ed4e3b6-a3fb-4773-91cf-16669f001586	beb62bde-2124-4e66-b727-e268e8870af8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 09:34:52.049228
19953f8e-724f-4d81-8253-546051a0d8ea	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-19	So we are working on this one, though this lead was brought to us by Vamsi but Tango already has knowledge about the same and he has been working with them as well.\n\nNow we have to wait and watch whether we will be able to do this or should we give it to some one else.	2026-04-18 09:36:54.765698
ffef4562-784d-4bd7-8283-006fd856b5bc	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-18 09:37:01.418773
5821e35c-1565-4fa1-9c39-794bf79d66e0	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-18 09:37:03.256436
02f49656-59dc-4a00-909d-fb0f4ab03fe9	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-18 09:37:06.707359
52afbeb1-0bfd-4d2f-909a-c8dc1d5f6ab0	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-18 09:37:52.50841
bdaef478-32c9-44ac-afdb-08900cca46f4	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		10000000.00	\N	2026-04-18 09:38:18.04459
7ee6ab26-393f-44c0-984f-4638654b590b	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		842e6e02-1157-44b5-8857-e195f516808a	\N	2026-04-18 09:38:23.801677
3a40c533-63dc-4128-9518-7e324ce416d5	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-18 09:38:40.315288
72fd4776-2860-4eb7-b38b-129ae098a094	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		f08ee1d2-e4e2-4130-8637-b1d04706af56	\N	2026-04-18 09:38:52.070964
d437562d-2b48-42ec-98e5-12203a9e4551	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-18 09:39:48.58344
ecbb63eb-57f1-48c8-9273-57786ad8a9ac	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		0b79d066-b90a-4a9d-a52d-fb29fd39585c	\N	2026-04-18 09:39:52.478267
8a3a0e3e-020c-47f8-b0d6-ef7e4f842b22	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Meghraj sir	\N	2026-04-18 09:40:18.665215
c1e1a669-b149-455d-ab00-723d74b4cbd1	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-18 09:42:41.070556
3bcc7f96-a5b0-47e3-9482-69600e80c3bd	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		1000000	\N	2026-04-18 09:43:53.160377
5cd2992f-42af-4d29-a375-97ad6694b9d7	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	1000000	1000000.00	\N	2026-04-18 09:44:09.956748
bcdb39ca-1863-42d0-a8f2-4b358dd0c075	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		b6b20be1-7162-49d3-bb9a-e32a5770649c	\N	2026-04-18 09:44:20.567527
6f722cb0-9823-4c86-83f5-9a1b0eb58308	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-18 09:44:32.383006
680e14fe-6ee4-45e8-9135-e3168050f50f	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		ff6fb865-f4ae-4a00-865d-a9515317e382	\N	2026-04-18 09:44:37.300316
a796ea41-5695-4226-a39e-a0c0963d3a5d	8f850381-4730-494a-9eb7-e25bff06898d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-18 09:44:49.507285
3b445c84-aca8-4daa-92c8-621a9ddae8d8	fba3e183-c1d0-4337-b636-a425dd40ab4b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 14:37:01.795797
6bd3d510-764b-4978-be32-ddf32567a16f	fba3e183-c1d0-4337-b636-a425dd40ab4b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-20	We need to register the company into the state authority. And then make the scope for hiring and then take things forward.	2026-04-18 14:38:27.78837
a0d01eb1-7d38-40b3-99fc-9ea93eba764e	fb55e5c8-9901-4f13-a53c-4677f2809680	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 21:35:32.60071
f60144cb-5127-4613-9175-1e923d2ec7df	c1fcb60d-b791-4f14-b575-aa6feafa63a8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 21:35:44.862032
dcd8ff93-664f-4d4d-bc84-02f78ce08eb5	8e5c39e3-7157-4a36-9fc5-bc4770e0fd0c	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 21:36:45.266721
7ec1a08d-2e71-4922-94e2-c60958f2f5da	4e36e760-13d0-4405-844a-03f9c372d12e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-18 21:38:13.933717
86e5bcbb-3bc2-4de1-bb20-fb16daac1d8a	b012c326-bcf9-4590-ae06-abd231f73057	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-19 12:20:55.638525
99970c2e-7954-4a5f-8a97-b4f6c0755ef2	13e18365-f746-4201-b770-52b86f09a964	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-19 12:21:17.086435
703a35f8-74be-4b4c-b976-b7c1c972bad1	0d929bc8-4a76-483e-9559-d3f296d777e0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-19 12:21:38.11332
b7e90c65-d21d-4fc0-9892-ac798d75c001	dc7a3761-cfe4-4fc0-a262-794bc31af50c	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-19 12:22:51.538298
b46133e6-ff8f-409d-b6ee-b8dc52cb4d88	fb8adc33-72fe-4a21-aedf-56939d0252a7	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue			\N	2026-04-20 11:05:38.247344
2d3700e0-f7fd-4756-b520-d6a5ecd2eb38	53edfb3f-50e4-449f-a41f-cbeab874ae77	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-21 04:57:39.050563
cb87aa0b-cd3b-40f2-b70f-b026bd20f30e	094b9883-1dbd-4080-8868-5cfa97dba293	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-22	We are still making a Proposal for the same, and still haven't been able to close the same.	2026-04-21 05:00:05.531222
6f94877d-02ca-42db-9aad-3d9f6c334309	2c4e1555-3429-49bf-a5b9-36b12aed73c5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-22	Have to take a follow up from Kajal for all the sites and then get the Project on track.	2026-04-21 05:01:04.312487
2d5f6e68-d0b8-44c7-ab4d-0ac425d09f7b	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-22	Have to take a follow up from Kajal for all the sites and then get the Project on track.	2026-04-21 05:01:22.169793
6cb3ad77-aa16-4243-b6e3-1763aaec02b7	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-23	Have to take a follow up from Kajal for all the sites and then get the Project on track.	2026-04-21 05:01:38.295378
9e188bac-4bde-45da-99c8-e402bcf1753c	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-23	During last discussion we had discussed that Apurva Bhai will get back to us!\n\nWe need to follow up again for the same!	2026-04-21 05:23:07.059711
daacde69-86ca-49cf-a596-f48a7188acb7	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-21 05:23:32.538686
e7a1b02e-9956-4f01-82e4-e0206cccbf0d	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-21 05:23:34.799309
57dd3c3d-31f8-47e5-acea-3f4d3a629807	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	company		Ref. Apurva	\N	2026-04-21 05:23:53.433363
3eab8c45-32b3-4272-b7b3-947269f60d5e	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	cold	hot	\N	2026-04-21 05:24:03.633216
76a5c708-00bc-4bf3-a913-b79d60ade31c	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue		85000	\N	2026-04-21 05:24:13.778036
27460bf2-ad52-4e67-a1a0-959c81816135	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		d8aed9b8-1b13-4206-9982-653bd01d0623	\N	2026-04-21 05:24:27.813987
72ea8ce6-a8f6-4e81-ab99-15cbf9d457ad	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		945ae736-dbf9-49cc-86bd-34dd74f5a84b	\N	2026-04-21 05:24:30.841773
a759e780-6907-490c-8e19-5b1a3343b1dd	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-22 04:12:04.578724
d4379cfc-b668-4745-9f12-eeb9d89aa7c0	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-22 04:12:15.288666
9b561012-0cc6-465d-98da-1b8d2d5cb349	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	company			\N	2026-04-22 04:12:24.465469
bf05185f-88bc-4ad4-a324-2d26675bdd6a	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadType	cold	warm	\N	2026-04-22 04:16:03.844207
b011c936-c0e0-4bad-9620-f5fec6cc3005	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue		7800000	\N	2026-04-22 04:17:14.404463
88baaf20-a7a3-40bd-a212-10c2a58929a3	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	serviceId		5b24f209-9cb7-47d5-81db-7334f3baf202	\N	2026-04-22 04:17:46.628099
83780fd7-5603-468e-ab71-668c449d9526	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadOwner		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:17:59.583769
1aa5a635-264f-4806-afd8-d28347d1b404	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:18:02.597245
8b06c813-4eff-436b-91ad-92186a167187	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	nextAction			\N	2026-04-22 04:18:50.147936
85ce1384-26de-4125-af60-acb0fbc3007f	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStageId		1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-22 04:21:15.267955
1c01e332-6170-4535-89bc-8452b8938ace	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-22 04:21:32.851127
d7d60a2d-55b4-427c-9d9c-a17cf5602872	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-22 04:21:37.904601
8b5bed15-c350-4420-ba01-0bc633cc8e86	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadType	cold	warm	\N	2026-04-22 04:21:46.129499
419b0300-0aa9-473f-b265-5a52f950c4a4	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue		7800000	\N	2026-04-22 04:22:35.183562
5ea01e33-2fd2-4ef3-acf6-5eebff0dbf13	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	serviceId		5b24f209-9cb7-47d5-81db-7334f3baf202	\N	2026-04-22 04:22:40.570979
61964b30-5f56-4461-b00a-b42618d6f5d8	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadOwner		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:22:48.763303
2cf9a061-3e3a-4aaa-ac6e-4caf06272993	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:22:51.651873
b99b4406-49f9-42d1-b89d-09801572f21f	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-22 04:23:12.76254
8a2f5bee-6c3c-4ad5-8091-de234baf3310	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStatusId		bd727ac7-e507-428e-99d0-30a0fd602750	\N	2026-04-22 04:23:15.986157
7ba99ae6-369d-41d0-b4a7-3de524244963	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	company			\N	2026-04-22 04:24:53.553495
3bd20539-aaca-4d06-86c8-c925c9b0a5a2	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadType	cold	warm	\N	2026-04-22 04:24:55.894209
2602b9cb-4625-4bb8-ba63-d0eaa89ed9a6	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue			\N	2026-04-22 04:25:01.262534
fd224414-a796-4d07-b35b-623a1dcd38c9	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue		10159173	\N	2026-04-22 04:26:14.464634
896b49c8-917d-4914-bea2-aff7f1ce1c02	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	serviceId		5b24f209-9cb7-47d5-81db-7334f3baf202	\N	2026-04-22 04:26:23.44477
15d0d579-ac3a-418b-b20d-7662eb354a53	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	leadOwner		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:26:32.128081
fe28a2cf-73fc-4466-a50f-9b41e5964091	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealHandler		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	2026-04-22 04:26:34.889076
5b99cdec-77b3-4cac-ab4c-e200bbc22387	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-24	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	2026-04-22 04:31:30.613369
9a38a9f3-7c24-46e5-ac33-4d130167fd70	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-24	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	2026-04-22 04:31:42.850668
f12ef8d6-e259-49f1-a58b-c71738d41dfb	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-24	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	2026-04-22 04:31:54.211401
02bd70a6-a1c3-439c-a08e-6d429c10550a	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStageId		04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	\N	2026-04-22 04:32:05.238936
c9450592-c5ed-4e5b-ae9f-667e05193683	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	pipelineStatusId		b172d3ba-af51-411b-9d60-5113d266d5c8	\N	2026-04-22 04:32:09.230286
9fcce829-8cec-4c5e-9c13-c66e47c573a4	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	company			\N	2026-04-22 04:32:13.120387
1f606051-e8e3-442f-bae7-893b20460c7b	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	field_update	dealValue			\N	2026-04-22 04:32:25.044555
b010ee5e-c83f-41d7-98be-533a695a980e	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	note_added	\N	\N	2026-04-24	We will receive the bills soon from them\n	2026-04-22 04:32:41.59949
02169544-b9b4-4a85-9488-731fe4b22297	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-22 10:55:15.142957
7223ca76-d157-4b25-bcf3-733cd9c49ba1	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-22 10:55:16.947708
88d4f382-f090-462c-9835-35a2b8a635bf	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		29cc66aa-92e8-408a-9da3-84bdaacf9b73	\N	2026-04-22 10:55:32.952882
bee5da30-2ffc-4c5d-a6a6-f248c1e203ff	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-22 10:55:40.762119
ecf91c7c-a61c-4273-823a-58cd96f9e069	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		dfdbbede-0a61-4ff5-855b-58f2e05c5dda	\N	2026-04-22 10:55:44.790405
c30c385b-8460-4e41-af55-2f81157d4239	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-24	Negotiation is going on with both the vednor and also with the client.. there is finally a difference of 3.5 lacs.. which we need to crease out.. for which we are working.	2026-04-22 10:56:34.704827
ce975bf3-cf7a-45af-b6e9-a21317f17929	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId		f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-22 10:56:51.447884
5d33e493-c8ed-47d9-b4c5-6630bb3d59a1	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		3fc91a6f-aa0a-434b-868f-f39f68162166	\N	2026-04-22 10:56:53.151975
1ac8145a-19c3-452f-899a-f3768dd4aa9e	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId		d38915dc-ecf3-45f6-ad3e-874212c27666	\N	2026-04-22 10:57:17.490629
2f8a5fe5-111d-482f-8fa1-ae62e5fd6dc3	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	serviceId	d38915dc-ecf3-45f6-ad3e-874212c27666	29cc66aa-92e8-408a-9da3-84bdaacf9b73	\N	2026-04-22 10:57:34.173105
de3776bc-0104-44d6-aeea-fe6e8d1a5472	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadOwner		3d325efb-4805-4230-ac98-d25543769e2b	\N	2026-04-22 10:58:13.973706
bfdd74a6-7f2b-41d8-9a69-6ff3e7bc1bf9	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealHandler		dfdbbede-0a61-4ff5-855b-58f2e05c5dda	\N	2026-04-22 10:58:20.038119
4736e4df-bd3b-4572-b9f8-9bb223e0240e	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-24	Negotiation is going on with both the vednor and also with the client.. there is finally a difference of 3.5 lacs.. which we need to crease out.. for which we are working.	2026-04-22 10:59:02.194456
f450e97b-3fe4-4624-aad9-ec9e6e1e6b7b	3cb1c833-b7af-4317-b47c-7d49440ee68d	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	pipelineStatusId	3fc91a6f-aa0a-434b-868f-f39f68162166	133149e5-d199-4829-ae26-7657ebdf27d6	\N	2026-04-23 06:58:47.424394
b8923d5d-4cbc-4d01-9ddf-0a1d50f58e13	3cb1c833-b7af-4317-b47c-7d49440ee68d	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd2c3618-323a-4bf5-aa87-cf4224c48185	\N	2026-04-23 06:58:56.643612
eba1fdd1-3c32-467b-9b15-fa9b66156e19	3cb1c833-b7af-4317-b47c-7d49440ee68d	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	pipelineStatusId	133149e5-d199-4829-ae26-7657ebdf27d6		\N	2026-04-23 06:58:56.643612
c40a5897-e3b1-4823-928f-138b97932ce1	3cb1c833-b7af-4317-b47c-7d49440ee68d	f08ee1d2-e4e2-4130-8637-b1d04706af56	field_update	pipelineStatusId		0d1682a0-923b-4762-96f9-980f2f6a4d10	\N	2026-04-23 06:59:01.497372
932754a8-e090-4073-8b24-1fad5989a444	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd2c3618-323a-4bf5-aa87-cf4224c48185	\N	2026-04-25 08:46:01.241463
c58d84a5-a7a0-4915-96f4-f73291a62ad2	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	bd727ac7-e507-428e-99d0-30a0fd602750		\N	2026-04-25 08:46:01.241463
9f2f3298-65bc-44e6-95eb-30675a532b27	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		0d1682a0-923b-4762-96f9-980f2f6a4d10	\N	2026-04-25 08:46:04.524919
36d8666f-d3e4-4d12-b01e-9074bcc175b3	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	800000	1000000.00	\N	2026-04-25 08:46:14.982996
f05a51b0-40a8-44cc-844c-08255fa61e5f	6c5f43d1-eb8c-4e80-8013-619d65fe0d35	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-25 08:51:24.9132
4c530dd8-a2b7-4fe3-935d-125a86adda79	0e9325bb-c08e-4b20-b774-494ffdd4b1b5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	100000	100000.00	\N	2026-04-25 08:54:20.809432
d8464637-151b-401a-87af-083111a62967	0e9325bb-c08e-4b20-b774-494ffdd4b1b5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	Waiting for the client to confirm the pricing.\n\nCurrently clients wife is in hospital so there is a delay in the confirmation!	2026-04-25 08:55:08.48854
7ae4f53e-ec62-4cf4-9a9a-7ddbd9155af5	7f946125-9547-4b95-9d5f-707a76b55888	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-25 08:56:51.264913
4c931a98-02d6-4851-a544-014374a14716	7f946125-9547-4b95-9d5f-707a76b55888	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	Waiting for the client to confirm the pricing.\n\nCurrently clients wife is in hospital so there is a delay in the confirmation!	2026-04-25 08:57:02.275399
129e1f8d-0068-4e53-a2c9-783a902f6fa9	6c5f43d1-eb8c-4e80-8013-619d65fe0d35	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	hot	warm	\N	2026-04-25 08:58:06.258037
46c22f62-1efe-43fe-9d5f-ac13d471820c	6c5f43d1-eb8c-4e80-8013-619d65fe0d35	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-05-07	Client needs the software, but is not in hurry as of now! so our next follow up is going to be some time in the next month.	2026-04-25 08:58:46.176566
318b9d40-afa6-4cdf-b6a3-2413d4d41f83	62455f46-dee0-41c7-9f27-2d9a88253a0f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-25 09:03:54.8681
286d5e5a-2794-40db-b632-9ae31eedbb0b	294cd38f-b922-46fe-8772-63fc6edc3983	945ae736-dbf9-49cc-86bd-34dd74f5a84b	created	\N	\N	\N	\N	2026-04-25 09:05:03.786732
d75e27cc-67d5-4abe-ad67-86338f5d3874	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	dealValue	1000000	50000.00	\N	2026-04-25 09:06:00.551689
9fa0503b-9b4c-415c-91df-59f05ac89c5a	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-25 09:06:06.161068
8ff33270-bfa7-4bc9-b98d-1017cd010e87	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-25 09:06:06.161068
8329fd2c-d1a4-4472-8793-5a25e48e1d6c	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		2eca1b84-280a-49da-a529-deeb563a9167	\N	2026-04-25 09:06:09.118265
922701f3-820a-4b3a-986c-ecf5e37c5ba8	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-30	The lead is not very agressive in terms of tech, but the work is going on.	2026-04-25 09:06:38.093919
0e1e4120-b36a-4d9d-83a1-f5086975bcda	0f7918e3-5203-46d9-b7fb-cd922d22c93a	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-28	Waiting for the customer to get back with the agreement. Project is closed and in the next week we will have the agreement and then the payment.	2026-04-25 09:07:44.409484
e4118bf9-220b-42dc-8301-5e77b9bd1283	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-25 09:08:02.180827
6710d1c6-a2fb-454a-b239-550e94e5843d	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-25 09:08:02.180827
a771f2eb-936c-404b-a8e4-ba15852b84c0	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	2026-04-25 09:08:05.327185
3311b67c-00b4-4198-b35f-7746fdc7b222	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	2 sites have been shortlisted and we have also started aquiring the same!	2026-04-25 09:08:31.013149
4124f896-a301-4f91-b66b-59c8051a89ab	08032964-787a-4e78-ae29-8e5381ed12c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-06-01	Next follow up has to be in June or July	2026-04-25 09:09:57.811981
29de9847-db49-4ee4-8926-c372e3e6a214	5ac8b29a-d6b7-45fe-a007-fe1adc738640	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-28	Chirag sir had followed up with them, and they have asked us to recheck with them in next week.	2026-04-25 09:11:53.222248
0ea2cfa7-9b1b-470b-aff8-287b9c69b97f	750770aa-eea0-4c1f-916c-42ca19b30bb1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-29	Site is going live on 28th April, and post that the maintenance contract will go live	2026-04-25 09:13:26.774387
d4f78d00-8a44-4b5e-b6b5-b975d8208f31	b130926e-14dd-4672-aace-22cc049a0095	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	\N	2026-04-25 10:42:43.548102
69847502-1c5f-4759-a7aa-abb4c193da01	b130926e-14dd-4672-aace-22cc049a0095	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId	b172d3ba-af51-411b-9d60-5113d266d5c8		\N	2026-04-25 10:42:43.548102
8ce2fe6e-da8b-4f42-a347-26b4f8774358	b130926e-14dd-4672-aace-22cc049a0095	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStageId	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	2026-04-25 10:42:50.869263
3b326e98-ff04-4ccc-8d4e-79ca4611a5c4	b130926e-14dd-4672-aace-22cc049a0095	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	pipelineStatusId		0b79d066-b90a-4a9d-a52d-fb29fd39585c	\N	2026-04-25 10:42:56.523056
ff011d18-8a18-47c8-b41b-c64e221edf00	72de1f7f-7a50-471e-b30d-8993dafa8621	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-06-10	Project is not going to work out for now. We have to circle back in 2 months again	2026-04-25 10:55:33.174379
750fd954-5364-4eef-948e-c7fee43882ef	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	This Project is closed and we have are waiting for the advance to come in from the client side.	2026-04-25 10:59:58.256645
285b56f4-33e4-4688-8443-f31831bf1653	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-30	The next follow up is going to be in next week.	2026-04-25 11:08:45.975181
5f20c3eb-50d1-42ea-a0d1-84f84a33e695	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	Tried reaching out to Kapil sir, but he did not answer my call.	2026-04-25 11:10:06.557316
c31e7c02-447c-4629-8eea-63f54bf2e403	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	note_added	\N	\N	2026-04-27	Tried reaching out to Kapil sir, but he did not answer my call.	2026-04-25 11:10:21.822604
e65fd719-d9af-4da9-bd43-08889b7c9e5f	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	hot	warm	\N	2026-04-25 11:35:27.432009
f006e590-f099-4f66-8da3-5c681d55ddd4	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	field_update	leadType	hot	warm	\N	2026-04-25 11:35:39.168433
\.


--
-- Data for Name: lead_companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_companies (id, lead_id, company_id) FROM stdin;
5f3a0998-aeef-4887-bd35-65bb7f365a62	516f4bee-d9da-49d5-8558-19be6bb8f38e	8ec77a3d-4558-4a5d-90ff-542a12720779
60f93e5b-15d5-453b-8309-f228ee23244f	968bd4b1-f06d-4814-a004-6d9bf16888f1	8ec77a3d-4558-4a5d-90ff-542a12720779
78a17cd6-22c4-480d-af33-27fe0981b9db	b6d86451-6790-4459-8dd0-915dc697836c	8ec77a3d-4558-4a5d-90ff-542a12720779
ff40b080-6fd4-4d65-b16d-6f0caa55057b	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	8ec77a3d-4558-4a5d-90ff-542a12720779
1d3caea8-644a-4fe9-9acf-3beec4149a5a	8ebc15b6-d903-4cf2-8096-e979dff75556	8ec77a3d-4558-4a5d-90ff-542a12720779
3e4275c7-dffe-42df-bc78-b421c730cfe1	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
5eacb698-ebc1-4102-968d-6f20c0008d13	152d0e1f-462b-4f73-942f-cb4ec38e5c64	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
f5179d2b-c3fb-4c90-8ee7-733a186b6202	116f1a8d-bb83-40f3-bba5-447560acbde8	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
b99df8e3-15bd-4755-bb94-e18e3bc4267b	5ac8b29a-d6b7-45fe-a007-fe1adc738640	955ca5dd-1667-4f92-bda6-ad22c1db3b91
103b8102-7083-45ee-9457-6252764ccc81	9182a748-0dbd-41f6-a516-05f94c338204	955ca5dd-1667-4f92-bda6-ad22c1db3b91
830e7829-d6f8-4b58-9760-b83bcee9c998	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	974f6d1d-0ef3-4b6f-9652-bc44c07d44a2
bf3df6ae-e1eb-4e95-ae8b-eec676b333a4	2c4e1555-3429-49bf-a5b9-36b12aed73c5	90928f0f-3a34-49d4-921f-02ae56df3e3e
25a30282-54fd-4846-bbae-3aa699329e5f	094b9883-1dbd-4080-8868-5cfa97dba293	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
0ebed012-6d07-455e-b3e2-c62d7026e983	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
fdddc669-dd35-4b9c-b923-f25a0a1ca56d	ab7e0e82-c2fc-4477-a087-299ae8c65603	8b2afa4b-d499-4ece-b16d-51c75eba9a45
9dc4c1c6-fff8-44fb-bbe2-7a8c7416a3e3	12064fa5-948f-419e-bd42-d10044009520	8ec77a3d-4558-4a5d-90ff-542a12720779
6d098400-f05b-4b77-bd26-453cf8cdb7f1	47d9efda-9857-4bef-bcf0-e913ebfe27c4	dbfd588e-84bb-4a9a-8e14-cd31333f58df
6bf6c020-9555-499e-9d9d-b597f3103184	b9869dab-b405-4e79-b361-2daddbefcd27	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
05ed5393-5772-4c27-a26a-9e93778e2db8	7bfa59af-ab0a-4de3-a86b-d329b01ecb98	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
6bae5ba3-4b35-4164-b737-547dd3b6d487	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
fb7a92cf-328c-41f9-a9ef-a4cd35d87125	05511e65-fba0-4aaa-ae6d-6974584fd350	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
f682c631-e97a-4e74-9eab-f62fe5aa9196	126cf547-76fc-4089-95e3-7306a46193f8	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
a6baa23d-b4d4-4f8b-af4f-a3409f5d2212	1636c45b-6e69-4b3e-800b-e815bd836042	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
c2dca6f8-e627-458f-ba91-fd899699a9f8	77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
5126632e-79a8-4e10-bb70-231d50911935	49492087-9f41-4f91-8a38-0e6d3267ce13	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
6169a6d9-90a9-4318-b079-7023d8fc7534	8bcbb937-c382-4ec9-b083-2a3fd599fc98	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
128fa721-76ec-464c-b5d3-e491196fa9c9	150ffcc0-69e1-46d8-adb9-15c8c213cadd	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
f84288ee-2feb-4a3a-933a-0498e151d028	a460194b-238e-4c45-b0c5-fc3ed0808626	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
6edf3bde-0552-4052-841e-a72934b2745a	59864d28-9491-418f-ba1d-1f0f9f53fd5d	8ec77a3d-4558-4a5d-90ff-542a12720779
051eca40-0c52-4710-9ea8-ee287669babb	ef3501da-4bb1-49bb-b3b8-778208ed42a2	8ec77a3d-4558-4a5d-90ff-542a12720779
91fc1611-60cf-4bdc-9568-7f3a935e4896	648bb18b-de29-40f1-99c7-604aa78004c9	8ec77a3d-4558-4a5d-90ff-542a12720779
23079ef0-19e4-4ed9-b84d-58edd52c2200	30c4ee16-9aa3-428b-82b1-0454ce8e193b	8ec77a3d-4558-4a5d-90ff-542a12720779
18e9ea44-c7e4-4216-96b3-725729e035c2	c6964247-6819-4ceb-8f32-2edff9a1211b	8ec77a3d-4558-4a5d-90ff-542a12720779
9d46aa14-223f-4c91-b657-8487145bceb1	4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	8b2afa4b-d499-4ece-b16d-51c75eba9a45
413cc0dc-01b8-485a-bef3-a971a14890ef	65441f98-668d-4726-b870-c41658904049	8b2afa4b-d499-4ece-b16d-51c75eba9a45
02d01319-1c15-4567-b44d-639c0a63555c	467feba3-019e-42ec-8b65-78a2c2860368	8b2afa4b-d499-4ece-b16d-51c75eba9a45
1936d43d-92dc-4e34-a46d-92158ed3a339	04f36275-3fa0-4ad4-aede-b47d157b0751	8b2afa4b-d499-4ece-b16d-51c75eba9a45
35d4f42e-e7ce-48e5-bac5-d35b96c5ff1b	b392726d-5883-4d3c-ae81-c15bddc1d370	8b2afa4b-d499-4ece-b16d-51c75eba9a45
43b56d55-78c5-4805-80d4-567e8e6d1176	904b4017-2e46-4684-828b-e97a813a9f2e	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
f7883d6d-7f56-4143-857b-40a779b992e3	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
f45177da-59d3-43ab-a381-aadd627778cf	f232ae3a-c913-441d-8c06-21a07b35e0e9	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
a3bfb4b4-b9d6-4b59-ac92-f8a33c8900e0	d3d9484d-9139-438c-938f-6d8781a4b1f1	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
e6cd5e08-d4ab-4211-b1c0-169cbd1787f0	ee9652f2-8f59-4e01-805b-1da1391ed757	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
a9821780-32e2-42f7-aee8-95abc84acab0	62fea596-e175-4ae7-8245-6f49f3d20247	955ca5dd-1667-4f92-bda6-ad22c1db3b91
74b8cb1c-bd93-480c-be10-3849dd42864f	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
43e38df7-dc88-4acf-bc87-11994c962ed2	bbd4221d-a22e-4ba3-99f9-d7ef13d70f88	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
780593df-3c1b-4005-ac50-df4c955bb964	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	dbfd588e-84bb-4a9a-8e14-cd31333f58df
a3b312ce-f019-460e-85b8-fe2c02e742ef	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
3bf9e028-00cc-472c-929e-64b33f9cfb4d	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
d8856edd-796a-452a-b93a-e52cc5a809da	50444fab-1804-4e27-8eb6-055a80d3d16b	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
eb12fe9a-4fea-45c6-b55e-2dab6147107d	70c99eb8-65ca-4b28-bf94-39fde23c224e	90928f0f-3a34-49d4-921f-02ae56df3e3e
9eb97b1a-07fa-4b97-82cc-6127a40ffab0	90559f16-f667-4338-8596-d77a61b5419c	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
3fa75bbf-baeb-455f-a5fc-1ce3c81856bc	e7af646f-d167-49c6-bc86-af1d56fb0e28	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
0b1f8324-42c6-4dcb-8104-993833f0ce33	feb883e7-7e03-4529-9895-874fd907b798	8ec77a3d-4558-4a5d-90ff-542a12720779
0a101c99-7ce1-4a61-ae39-b3d6384f1a6a	2df58b0f-8c32-4f2c-b404-a50eab8b1623	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
0e47e7f6-997d-48fc-b80a-d356ee0eb3c2	6d252cc4-433a-4f06-9bd9-73250890d192	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
6bbe5b14-e204-43f9-b926-29a042fb0406	3536b868-ba38-4482-933f-ae942e9eba9f	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
6d7ce7ba-fa79-4188-b2b7-a767f6c8ee68	952792fe-29dc-4807-9e8d-71a84d09de5e	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
b6d45986-48bc-4939-975d-1d6f6a1e185c	b130926e-14dd-4672-aace-22cc049a0095	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
61fa1401-30f0-4921-99cd-9c02eb89d84b	d611930d-6919-4d47-b1b6-3fe4d7cd42d0	8ec77a3d-4558-4a5d-90ff-542a12720779
a7dc17c8-f2d2-4da9-aeca-80b102f551cb	63a40123-2216-47b7-b485-30bbc5cc7606	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
933cee92-5cd5-40c5-a63b-ead52d1778e0	92b6a619-2d78-4e23-bd96-e38158ee82db	8b2afa4b-d499-4ece-b16d-51c75eba9a45
74375d7d-8690-4702-8014-70e9489a72e5	1acc4207-bfa8-4903-a246-281a3dfa7f32	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
52e4f068-b46d-4c43-87c6-564f8080bd32	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
63c133ec-9405-4fd8-b124-d2887f333661	92b7daa3-16af-4b69-a3e6-d40ec1135b3c	955ca5dd-1667-4f92-bda6-ad22c1db3b91
2e000f30-fa9a-41dd-92ec-c7fe529a450b	34187200-4dbe-4838-bd92-1cd25ab3a743	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
e21b8b7b-ca0b-4d00-9e7a-34d19ba9fa48	72de1f7f-7a50-471e-b30d-8993dafa8621	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
764651ce-c19b-406c-ae27-699c94c8193a	c9988da9-d34c-4ce7-8631-b0134dec6a17	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
2fd5ff57-cb3b-415b-a320-e83dacaa5912	e2ca0c09-4118-403e-8c74-21d8b2ab7e93	8ec77a3d-4558-4a5d-90ff-542a12720779
e3502a0d-8eaf-496d-9a58-ed09362f63be	0d2418e4-e6f8-45f4-8089-2b08e485baa8	dbfd588e-84bb-4a9a-8e14-cd31333f58df
5df0cb8e-fcbd-4e04-9dd9-c05559648e3d	9c4532c2-3192-4d0e-ace3-98f7122d0e0c	955ca5dd-1667-4f92-bda6-ad22c1db3b91
c5d1c48f-dffb-4c8b-8920-909f62a9fa08	5f12c08d-3382-4b98-9341-25748734d63d	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
b24b8805-d9a9-4092-a558-7d882e3b91ab	9841d159-eabb-4cca-a5e7-838a3424c763	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
bab53e71-6aee-4914-93c3-5c5d069d0219	aec25480-c9b3-41c6-8201-0b5cce2c6731	8b2afa4b-d499-4ece-b16d-51c75eba9a45
b198830e-9033-4daa-8c1e-f3b1a21018c7	003dae3a-7633-4615-a1a9-182e7c162620	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
ae786d21-181e-48a6-a8ec-a43d0988b9ed	ad749e5e-173b-4ba9-ae0b-ac37d8b4d84b	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
16d2e3b0-e328-441e-ad35-b3397f5107fa	947522b5-7459-4bf9-9dc5-5a6ed2153c91	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
e0d4317f-8c6f-4006-b0cc-3da23cbdae4d	c6a1d81a-e922-41d1-85d2-80c947455da2	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
ebedcd0c-18a3-440d-b78c-18fd5a494130	bef3049b-d18e-4e71-bb91-cb01d1193eac	8ec77a3d-4558-4a5d-90ff-542a12720779
4b4b07fc-87fa-464d-8816-5d22f3c53903	c4bb6605-fc77-4508-b63d-80a08b12cbbe	dbfd588e-84bb-4a9a-8e14-cd31333f58df
7ca1f7ac-bba6-4b03-befa-12c9f4379ed0	6baaf530-8d70-4279-a904-a759a773f176	955ca5dd-1667-4f92-bda6-ad22c1db3b91
76283d97-465a-49b5-88e5-951ae8ef03a3	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
2215bbfa-ca3c-40fd-aa7d-961d61242b45	7cde05b5-c42e-4781-9aaf-120cf346993e	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
bece0ea1-777a-45da-83d6-d0c2ad2a14f2	c9e12414-6ed7-4eb6-a577-356527a14f87	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
93935179-4508-4484-81bc-950849179048	750770aa-eea0-4c1f-916c-42ca19b30bb1	955ca5dd-1667-4f92-bda6-ad22c1db3b91
69200623-0240-4a29-828e-3aae6ec82bb7	0f7918e3-5203-46d9-b7fb-cd922d22c93a	15da675b-4b4d-4c3a-a466-76ab6da7b5d5
20e2e685-d97c-4d0d-b1b7-d101cfe7425b	24d15bb7-20b2-4997-8b09-5b7a2ebbe792	955ca5dd-1667-4f92-bda6-ad22c1db3b91
68e1648e-7187-49b8-910f-b8a638487928	823d8a28-e746-4023-88f5-1658d8e931cb	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
a8f3a3c6-65a3-4ea0-8122-6fa7bce3b045	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	955ca5dd-1667-4f92-bda6-ad22c1db3b91
43914a32-2cf1-4a90-bd51-3b1f45e72dcf	be8f7464-de18-40ae-8b77-6765b21b71b2	955ca5dd-1667-4f92-bda6-ad22c1db3b91
8ad3ef02-5781-4c89-ab7e-e16fce835504	84409426-1c97-40b1-9525-014bc4cc72c8	dbfd588e-84bb-4a9a-8e14-cd31333f58df
ae4eb21b-0680-408c-b4eb-9c677aaa868d	3cb1c833-b7af-4317-b47c-7d49440ee68d	955ca5dd-1667-4f92-bda6-ad22c1db3b91
e2ac1426-fa03-454a-97d1-fcb6ae401fc7	de5a5c4d-1a78-4f88-ac84-f330613f373d	a457000d-2255-4325-968e-d0686a4beca2
f6c759d3-965c-4f1b-a8b9-6d9e7ad1e2c9	b59f8570-d8f3-4c21-8572-bbd9ee5c2ae2	955ca5dd-1667-4f92-bda6-ad22c1db3b91
239a1835-2445-4ce6-a317-16145abd5630	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
7c867eef-a12e-46cb-a126-e910eb459182	4264ecb0-06f9-466c-a130-35b04dc7d437	955ca5dd-1667-4f92-bda6-ad22c1db3b91
4ba07a3c-d91e-4c2a-be79-e43b209e86cc	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	15da675b-4b4d-4c3a-a466-76ab6da7b5d5
af303bb7-136f-4138-a3d8-dbc43b1d0a5a	08032964-787a-4e78-ae29-8e5381ed12c8	955ca5dd-1667-4f92-bda6-ad22c1db3b91
679c433a-2a24-4975-b043-eaf7e8465857	0e9325bb-c08e-4b20-b774-494ffdd4b1b5	955ca5dd-1667-4f92-bda6-ad22c1db3b91
1d6f02ec-7f20-4429-aeca-fe123b21a427	97c58426-102a-4aca-a632-9cca4c645c89	8ec77a3d-4558-4a5d-90ff-542a12720779
9446a233-fff3-4bcb-b9f7-b4ff1a95b966	beb62bde-2124-4e66-b727-e268e8870af8	8ec77a3d-4558-4a5d-90ff-542a12720779
87941a63-06ec-4899-bb33-ac1a978b3a50	986f53f0-0c9e-48c2-8b93-0f752beef2ca	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
0e48923b-c6e7-48f3-93db-ce3696bb10e1	8f850381-4730-494a-9eb7-e25bff06898d	2dc2c5b2-67a6-45c8-bdeb-99250c26e4f3
4124b85b-00fa-4376-9d93-e609fbaa304b	fba3e183-c1d0-4337-b636-a425dd40ab4b	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
682456e6-bfb5-4a2e-a70b-422d894bf176	53edfb3f-50e4-449f-a41f-cbeab874ae77	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
40b79f2c-d0a2-4040-b1de-b110486e65f8	cb2f7179-3f4e-4526-8305-1432c98526b4	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
7ec7f58f-634a-441f-96c6-7e5dfb0d4bbe	b1897ee5-021c-41f9-8335-2aaddb7744c5	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
fdf6788e-5360-4ba6-a282-d3e58968eda7	74883637-2831-4ef3-a58f-e169276c0dc8	519d2c6f-29ef-46a2-b1b9-7f1135114aa0
4b13084b-3932-431c-a2d6-fc931b116c71	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
6c62d259-3ce7-4660-b2b4-c54a675957aa	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	7dd1bd8b-3e7b-4781-8106-50df515ab7ee
0c5cde88-c402-4d6c-9d7d-339482542427	6c5f43d1-eb8c-4e80-8013-619d65fe0d35	955ca5dd-1667-4f92-bda6-ad22c1db3b91
74ca32e8-4805-49be-9cf2-5bc4645c0364	7f946125-9547-4b95-9d5f-707a76b55888	955ca5dd-1667-4f92-bda6-ad22c1db3b91
34967630-e13d-4de0-8831-9cf47203206b	62455f46-dee0-41c7-9f27-2d9a88253a0f	955ca5dd-1667-4f92-bda6-ad22c1db3b91
42583d5f-e0e0-49f6-a27e-f397f32eb7cd	294cd38f-b922-46fe-8772-63fc6edc3983	955ca5dd-1667-4f92-bda6-ad22c1db3b91
\.


--
-- Data for Name: lead_documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_documents (id, lead_id, file_name, file_url, file_size, mime_type, uploaded_at, uploaded_by, stage, status, note_id) FROM stdin;
\.


--
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_notes (id, lead_id, user_id, content, stage_context, created_at, follow_up_date) FROM stdin;
a32f14f1-44e7-47b5-bc99-4c2169d5337b	516f4bee-d9da-49d5-8558-19be6bb8f38e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Burger King @ Bhumi Mall 2 Internet Connections required\n1. 100 Mbps Broadband\n2. 10 MBps Lease Line	\N	2026-04-02 03:41:05.062357	\N
913aaa9c-b178-4b83-8bb8-b0df41dd962d	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	439kV (Open Access) either Captive or Group Captive	\N	2026-04-02 05:45:15.795469	\N
d7a045b4-4e3e-40e2-9b39-16f08cdb6d7c	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We have considered the pricing for this @55,000 per kV\n	\N	2026-04-02 06:10:00.405224	\N
0b49bda2-1461-4a36-a373-f45e87a66a4d	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Proposal has been sent to the customer and we are waiting for them to get back to us for the same	\N	2026-04-06 11:51:39.452438	\N
fae04790-acdb-478d-9b03-7fde7232c669	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Proposal has been sent to the customer and we are waiting for them to get back to us for the same	\N	2026-04-06 11:51:41.05446	\N
94ce43c0-3222-402d-838f-e5ee6c86b5d9	47d9efda-9857-4bef-bcf0-e913ebfe27c4	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Have shared the proposal with JIO for now and we are waiting for them to get back for the same.	\N	2026-04-06 12:14:02.600255	\N
3dfc70a3-3a60-41ed-8b19-66c0f7aeaf1a	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to acquire 10 locations for Amazon India for Telecom Shelter	\N	2026-04-06 14:12:21.943617	\N
94894923-01d0-41d4-a2b7-78b90e8382e7	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to acquire 15 locations for Amazon India	\N	2026-04-06 14:12:55.00092	\N
acd9d9bc-cfb6-4e37-b296-835f8ede112b	9182a748-0dbd-41f6-a516-05f94c338204	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to acquire 25 locations for Amazon India between Maharashtra Locations.	\N	2026-04-06 14:14:55.126175	\N
e85b269e-bbc4-4a75-b60c-52e15859ffa3	2c4e1555-3429-49bf-a5b9-36b12aed73c5	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Locations have to be between Mumbai & Hyderabad Locations	\N	2026-04-06 14:15:54.529776	\N
342b6e0a-9406-4dee-a179-1d68b771a5e8	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	6f65730a-b2a4-475c-9ffe-45f4f7347b97	The Locations have to be between Mumbai & Hyderabad	\N	2026-04-06 14:16:34.754054	\N
77b4beaa-b9e4-4cbb-956c-0ff6725f5493	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We have to send the proposal for the same, check with Chirag sir and Shashwat sir for the same	\N	2026-04-07 03:33:17.959527	\N
c098bfbe-c67d-4be5-9e1e-7d82456a0547	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We need to put in chargers for 10 parking lots in all.	\N	2026-04-07 04:01:24.524459	\N
3a4293f3-0c4f-4685-9a8c-58971ec0e4d1	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Agreement negotiation is going on currently for the same	\N	2026-04-07 04:01:46.25287	\N
280c6970-20f1-4c6a-b965-2734d4daba5e	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	Today we had a meeting with client. they want to replicate the existing ERP	\N	2026-04-07 11:47:28.457216	\N
f129ea14-0e29-40a7-84b4-b1367b7a62e1	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Our first meeting and Proposal is given today, we have identified BESS opportunity as well.\n\nWe need to check the billing again and plan the same.	\N	2026-04-08 13:20:58.094959	\N
3315e401-ff91-4e79-bc2f-66a7515f5814	90559f16-f667-4338-8596-d77a61b5419c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	He has asked us to contact after 15 days, shashi dada spoke to him for the same.  We will get back to him post 23rd April\n	\N	2026-04-08 13:22:47.775968	\N
340fe133-5057-4718-a273-b4faa894703d	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to get in touch with the client, and ask him about the content for the same	\N	2026-04-09 03:43:15.23276	2026-04-10
6e5bc4a4-10f1-40e0-a01d-3ebe1f281502	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to speak to Yash for the Project execution and see the way forward	\N	2026-04-09 04:07:23.178101	2026-04-10
37bbfef2-daec-46dc-b9c3-949e564a4a44	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Work on this Proposal with B Team and make a POC Proposal and then reach out to him in a week or two.	\N	2026-04-09 04:32:45.706985	2026-04-11
613d3657-940f-4c88-82d2-8770f7000dde	3536b868-ba38-4482-933f-ae942e9eba9f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Speak to Amol and get back to him with a new offer	\N	2026-04-09 09:33:09.305292	2026-04-10
5de3f5f8-a47a-490f-b5e3-8b31c7231d43	70c99eb8-65ca-4b28-bf94-39fde23c224e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Flow diagram to be submitted and he is asking CAT 6 cable also to be added into our scope to which both Kenil and Sohil have said no	\N	2026-04-09 09:38:44.69461	2026-04-10
48f00f1b-7693-4572-a3b1-1250e5dff0fa	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Agreement has to be drafted and then to be submitted to the client. Zeel & Sohil are working on the same.	\N	2026-04-09 14:28:31.872148	2026-04-10
e8f09360-d52b-4036-b0dc-0a231ad39353	b130926e-14dd-4672-aace-22cc049a0095	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We have had a discussion with the main person in the Society and now we have to conduct a survey at the location and then have to take the Proposal for them and get back.	\N	2026-04-09 16:39:50.701757	2026-04-11
6a960813-7a0d-474c-a746-b53dc2632099	952792fe-29dc-4807-9e8d-71a84d09de5e	6f65730a-b2a4-475c-9ffe-45f4f7347b97	The draft is sent to the customer today.. now we are awaiting their response on the same	\N	2026-04-10 04:07:52.003793	2026-04-12
1b2f6126-5341-4d32-8305-e4bbb068c8bf	a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	6f65730a-b2a4-475c-9ffe-45f4f7347b97	These numbers have to be worked backwords.. we have taken some time to get back, so by saturday we will come up with some solution on the same	\N	2026-04-10 04:11:41.095007	2026-04-12
009f2531-ae03-4292-93f7-04f164691c87	90559f16-f667-4338-8596-d77a61b5419c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Next follow up is after 15 days	\N	2026-04-10 09:52:34.636115	2026-04-25
8e627f59-b92c-4690-b86d-cf9201c5eed5	2df58b0f-8c32-4f2c-b404-a50eab8b1623	6f65730a-b2a4-475c-9ffe-45f4f7347b97	This meeting is going to be in the next week lets follow up post 13th and 14th	\N	2026-04-10 09:55:54.885003	2026-04-14
6e535181-4da8-4671-ab5b-2a3dddc10dc6	1acc4207-bfa8-4903-a246-281a3dfa7f32	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We will get 5 locations from Sandeep sir by tomorrow and we will put the proposal inward on monday	\N	2026-04-10 10:02:17.922448	2026-04-12
73d41965-895f-458a-b194-b964efb31d7f	e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We had a first meeting with the company and now we have asked for the bills, which they should give it to us by today.\n\nAlso, we need to make the Proposal and give it to them by monday.	\N	2026-04-10 14:44:06.079574	2026-04-12
9e84dade-2a1f-428e-ace6-bdbf288d1806	8bcbb937-c382-4ec9-b083-2a3fd599fc98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	As spoken to Rishikesh, we can give this demo by the end of April.\n\nAlso, we have Reena has made some document which we need to give to Rishikesh and get him to start working on the same.	\N	2026-04-10 14:53:45.178305	2026-04-13
d2b5852b-1bd7-40e8-9bdc-98f4cacd0221	77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Only once we are done with the development work for ROR then we can show that to Aulivia and then she can help us with the Investment. But for now i think we should start working on the Investment Pitch deck for Aulivia.	\N	2026-04-10 14:57:10.067632	2026-04-15
8f189541-03a6-4c10-a19a-f9eb896fd5c1	7bfa59af-ab0a-4de3-a86b-d329b01ecb98	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We are working on the corrections, which were given by the client. But in the mean time he wants to get in discussion with the developer.\n\nAlso, we have to raise the invoice for the payment.	\N	2026-04-10 14:59:21.179337	2026-04-12
3ecc82d0-327e-4804-91d3-9cb047ed55fb	3536b868-ba38-4482-933f-ae942e9eba9f	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We are still awaiting call from Amol and are yet to hear from him.	\N	2026-04-10 15:04:14.554509	2026-04-12
7577f765-28a8-418e-96ea-bba5d56b274f	de5a5c4d-1a78-4f88-ac84-f330613f373d	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We have sent the proposal to the client and now we are awaiting their response.	\N	2026-04-10 15:05:48.92934	2026-04-13
e7d9c167-e7ac-4f34-9529-cfe7cbcd2b33	5ac8b29a-d6b7-45fe-a007-fe1adc738640	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We need to have an internal discussion with the core team, and then give a ball park to Apurva.	\N	2026-04-10 15:06:59.767714	2026-04-12
65f69fea-bd8e-4fbd-9e80-83dfc615b5d3	7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We need to submit the prices for this one. \n\nMeghraj sir and Yash have to come back to us on this one. Also, get in touch with Nitin sir and the Ease my AI team for the same.	\N	2026-04-10 15:08:30.705302	2026-04-13
cafd9ab8-341e-4fd3-8aca-ca62a790f700	50444fab-1804-4e27-8eb6-055a80d3d16b	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Proposal has to be submitted to Ms. Aulivia for Investment. and have to submit the same by next week.	\N	2026-04-10 15:38:13.343066	2026-04-14
c8684abe-8e4f-4dc0-a166-2b174006280f	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	2ee5a850-f5e2-491e-9acf-799d9774cd21	Once the infra will get ready, we will start the on boarding process.	\N	2026-04-10 15:40:15.917015	2026-04-14
631a4e7d-758c-445c-a101-4444c2cf48ad	516f4bee-d9da-49d5-8558-19be6bb8f38e	2ee5a850-f5e2-491e-9acf-799d9774cd21	Once the infra will get ready, we will start the on boarding process. 	\N	2026-04-10 15:41:46.142916	2026-04-14
97204a20-7f9e-46f2-802d-ec20fccca330	feb883e7-7e03-4529-9895-874fd907b798	2ee5a850-f5e2-491e-9acf-799d9774cd21	Once the infra will get ready, we will start the on boarding process.	\N	2026-04-10 15:42:22.135717	2026-04-14
9d9f42a2-1b9c-4307-84e7-aaa07828f246	8ebc15b6-d903-4cf2-8096-e979dff75556	2ee5a850-f5e2-491e-9acf-799d9774cd21	Once the infra will get ready, we will start the on boarding process.	\N	2026-04-10 15:43:59.997744	2026-04-14
5a6b6c6e-454e-427e-8d9a-4b3b7ddd9b71	47d9efda-9857-4bef-bcf0-e913ebfe27c4	2ee5a850-f5e2-491e-9acf-799d9774cd21	Update from Mr. Omkar Lad: Discussing internally for specs finalization and he will revert next week	\N	2026-04-10 15:49:57.478182	2026-04-15
f96bcfc6-b5e4-4554-ae83-a5f70e850dc9	af1fa33a-3462-4ea2-8f61-824e37d4e8e0	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Still waiting for the client to get back to us.	\N	2026-04-10 15:56:28.614213	2026-04-13
5ed566a1-d039-49e8-87a4-c21934e4d545	05511e65-fba0-4aaa-ae6d-6974584fd350	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Need to speak to Yash for the same, will get it done by tomorrow	\N	2026-04-10 15:57:06.657225	2026-04-12
f644521d-4ccb-497e-a7bd-2b7165d39b1f	e7af646f-d167-49c6-bc86-af1d56fb0e28	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We have given an agreement of 39 pages, so now we are waiting for them to get back to us with their inputs	\N	2026-04-10 15:59:07.60889	2026-04-13
d30a2edb-267d-4ebc-9584-ad8b2490b0f7	70c99eb8-65ca-4b28-bf94-39fde23c224e	2ee5a850-f5e2-491e-9acf-799d9774cd21	Once the infra will get ready, we will start the on boarding process.	\N	2026-04-10 16:00:40.493474	2026-04-15
158176e7-ca14-4c96-80c0-1d3530b665e2	0d2418e4-e6f8-45f4-8089-2b08e485baa8	6f65730a-b2a4-475c-9ffe-45f4f7347b97	We need to send them some kind of 3D model of the drones, and he further wants to connect us to Rajnath Singhji. Shashwat sir knows all about this.	\N	2026-04-13 04:07:31.467695	2026-04-16
05c4072d-cfe1-4e71-a022-b6fe3bfa0057	92b7daa3-16af-4b69-a3e6-d40ec1135b3c	d8aed9b8-1b13-4206-9982-653bd01d0623	Tomorrow Dr. Bandhan Sir has meeting with RVNL	\N	2026-04-13 06:59:55.037766	2026-04-15
8172f59d-b95c-4582-9543-6e3498e10bb4	34187200-4dbe-4838-bd92-1cd25ab3a743	6f65730a-b2a4-475c-9ffe-45f4f7347b97	Today we had a discussion with Ritesh Bhai from the Ahmedabad and we have asked for a revision in the rate to INR. 4.10/- per unit.\n\nAlso, we have understood that we will be doing 50% DC loading and also have to give 3MW BESS for the same.\n\nFor now i have asked Ritesh Bhai to give me an Scope of work Terms for both the parties. And then we can move forward and if we needed we can meet in Jaipur on 16th when I & Kenil are travelling there.	\N	2026-04-13 13:36:45.916105	2026-04-15
2d056213-90fc-493a-a38f-fab4978da048	3905cbe0-c377-4cfb-a10f-22a8fd2b501b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Tried reaching out to Chirayu sir for permission if surveys, but no answer	\N	2026-04-14 04:09:36.764994	2026-04-16
7722b96f-ac74-40cc-b947-9978d92b8512	6d252cc4-433a-4f06-9bd9-73250890d192	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have to meet Raymond and understand the commercials and then get back. Next meeting is scheduled for 16th.	\N	2026-04-14 04:18:48.824867	2026-04-16
04c9214a-5086-4a5a-89dc-c47186da6b08	2df58b0f-8c32-4f2c-b404-a50eab8b1623	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have to meet Raymond and understand the commercials and then get back. Next meeting is scheduled for 16th	\N	2026-04-14 04:19:06.550164	2026-04-16
9a8b9017-0ff4-40bf-b5f2-df7c26de3dd3	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	The client reached out to shashwat sir but we could not conclude and today the client is not receiving the call.. we will wait for them to get back. 	\N	2026-04-14 04:20:16.490685	2026-04-16
68ef3ca2-86d7-4bfc-bf47-58f4f68bf264	5ac8b29a-d6b7-45fe-a007-fe1adc738640	d8aed9b8-1b13-4206-9982-653bd01d0623	Apurva sir will discuss with the Client about the software application	\N	2026-04-14 06:18:02.619019	2026-04-16
bcfc3037-256b-462e-9dab-886172543d58	5f12c08d-3382-4b98-9341-25748734d63d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We had given the costing to Capt. Mert, but we took a lot of time to take the costing from the vendor and to give it to the client. \n\nBhandarkar sir delayed this a lot and in the end the customer really lost his patience with us.!	\N	2026-04-15 13:07:49.1475	2026-04-17
91b7366b-d9a9-4dbf-ba02-9cfb36a6abb9	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Have to speak to the client and ask him to send us the layout of his site for now to start working on the same.	\N	2026-04-17 11:30:08.821308	2026-04-19
23769680-00ab-422f-8188-afe493052bff	c9e12414-6ed7-4eb6-a577-356527a14f87	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have to find the Multi Party meter suspense from our sources.	\N	2026-04-17 11:32:04.843457	2026-04-18
ab71c3c4-d631-4ac8-b1ef-46dcd7afea99	bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Spoken to Tambde sir to get the layout and everything around the same.	\N	2026-04-17 11:41:16.532392	2026-04-19
518283cd-f111-4a09-a4ef-f83a0f23b32c	7cde05b5-c42e-4781-9aaf-120cf346993e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Getting in touch with the MSEDCL guys to get the Connectivity is there or no for the same Sub Station. \n\nThis work will be done by Tango. The co-ordinates have been sent to Tango for the same.	\N	2026-04-17 16:16:06.618692	2026-04-19
4616269d-49f7-4520-8c96-63fd0e84fab9	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have sent the Tender Documents to the Institute, there are some punch points which are pending. But for now we have sent the files and now we are waiting for them to get back to us.	\N	2026-04-17 17:26:21.889322	2026-04-19
19eb4b62-297d-4fbc-8c67-29183ff794c3	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have sent the Tender Documents to the Institute, there are some punch points which are pending. But for now we have sent the files and now we are waiting for them to get back to us.	\N	2026-04-17 17:29:23.487617	2026-04-19
bd3a33c4-47a6-4671-9767-b86ad4f9e0f9	24d15bb7-20b2-4997-8b09-5b7a2ebbe792	945ae736-dbf9-49cc-86bd-34dd74f5a84b	To sign the documents which have come. \n\nWait & watch	\N	2026-04-17 17:30:45.576965	2026-04-19
a59f125d-574e-426f-ba68-3ab64a596f05	84409426-1c97-40b1-9525-014bc4cc72c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Project work is on the way, we are putting a partial setup with Solar on our own Trackers on the Building for the 50% consumption off taking. In next week we will be achieving the same.	\N	2026-04-17 17:37:42.866823	2026-04-18
fce8eea6-175e-4c1d-bf62-0d8d22b6fc61	3cb1c833-b7af-4317-b47c-7d49440ee68d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We have already one the contract. But we are trying to win the contract by giving developed application using AI and not out in house resources.	\N	2026-04-17 17:39:53.595239	2026-04-19
c662c76b-ece4-436f-838e-dd6079971d04	de5a5c4d-1a78-4f88-ac84-f330613f373d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	After submitting the quote to the customer. Customer has said the quote is very high and hence they have shelved the project.\n\nBut we will reach out to them again in the next week and in the mean time we are also trying to get another quote from another vendor and try to close the same.\n\nWill have to take an update from the Chirag sir, as i have asked him to speak to Bhavik to get the costing little down and have also asked Shashwat sir to ask the client what is their expectation for the same.	\N	2026-04-17 17:45:49.073099	2026-04-21
080a7dec-1e9a-47dd-a3b7-a4941720ace1	c6cff992-d1c9-4aa9-8c99-f854a7e2202d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Need to follow up with MEghraj sir and make Proposal for the client/ Investors as well.	\N	2026-04-17 17:48:19.056736	2026-04-18
a4670091-d29b-4d4a-be38-a232133e86af	b9869dab-b405-4e79-b361-2daddbefcd27	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:39:41.796163	2026-04-20
f8b7aacf-e6c6-4ccd-93d4-e723323d75f9	12064fa5-948f-419e-bd42-d10044009520	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:40:01.160196	2026-04-20
2883cad3-c3d1-46aa-b5e4-5858aa0d886f	ab7e0e82-c2fc-4477-a087-299ae8c65603	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:40:13.643076	2026-04-20
540e5855-cf98-4d24-9d9a-b4096297d0ac	7ffd18ef-93be-4c80-86b3-9d05c33cb35d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:40:27.436181	2026-04-20
f036fe96-2083-41a5-b747-ce8f0aae89a1	bbd4221d-a22e-4ba3-99f9-d7ef13d70f88	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Need to get in touch with Sohil for the same, remind me tomorrow and i will get it done.	\N	2026-04-17 18:40:59.216481	2026-04-19
616e6261-86bf-45d4-bb0e-31426bd288bd	ee9652f2-8f59-4e01-805b-1da1391ed757	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:43:52.900024	2026-04-20
20c21b62-9f72-4a75-a8fc-272688eb5f96	d3d9484d-9139-438c-938f-6d8781a4b1f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:44:06.174532	2026-04-20
cc43e46a-c723-4cbb-8e64-37cc9f66fd34	f232ae3a-c913-441d-8c06-21a07b35e0e9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:44:16.097387	2026-04-20
40a150d8-0e3b-4bcc-bfc2-0eef7d51ab7f	f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:44:42.282961	2026-04-20
0d36f762-8b77-4dd9-8aa0-4f8bec9ebc6b	c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Need to get in touch with Gagan for way forward! the current pricing which has come, basis that it will be too difficult to close this.\n\nWe can also order the item from China and get closer to the Delivery for the same price.	\N	2026-04-17 18:46:23.737087	2026-04-20
2ea60359-5a8b-468a-ba23-0be7c51a461c	904b4017-2e46-4684-828b-e97a813a9f2e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:49:14.572858	2026-04-20
36357238-f714-469d-935a-689a29341540	b392726d-5883-4d3c-ae81-c15bddc1d370	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:49:24.557812	2026-04-20
a278d37f-db3a-48d2-89ae-8664527937f4	b392726d-5883-4d3c-ae81-c15bddc1d370	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:50:19.518762	2026-04-20
cdab6c7d-7c58-48a2-88f1-17c108bcc286	04f36275-3fa0-4ad4-aede-b47d157b0751	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:50:38.583291	2026-04-20
0d02f1dd-831c-4bd2-aeba-c66e4b2623d8	467feba3-019e-42ec-8b65-78a2c2860368	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:51:34.256721	2026-04-20
0d2efa04-cc15-41a5-95e3-dff2480055a2	65441f98-668d-4726-b870-c41658904049	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:51:43.336472	2026-04-20
772659aa-29a9-4d12-8e1f-eca2314b991b	1636c45b-6e69-4b3e-800b-e815bd836042	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:52:06.970119	2026-04-20
4e15da38-138c-4677-8db7-32c24309735c	126cf547-76fc-4089-95e3-7306a46193f8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:52:16.378146	2026-04-20
53de5384-32e4-45ce-8f37-998a32dbbe67	49492087-9f41-4f91-8a38-0e6d3267ce13	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:52:24.010077	2026-04-20
b0d359dc-0c54-41b2-a35d-47b1b1a9c0af	150ffcc0-69e1-46d8-adb9-15c8c213cadd	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:52:31.919607	2026-04-20
f75b0c5c-3b3a-4cbf-b541-4eb4eacaed7f	a460194b-238e-4c45-b0c5-fc3ed0808626	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:52:44.02092	2026-04-20
c66cf172-94af-42ae-81aa-4694747d0038	59864d28-9491-418f-ba1d-1f0f9f53fd5d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:53:00.63069	2026-04-20
ccc1fe3a-7772-4716-9bcd-13a092f17045	ef3501da-4bb1-49bb-b3b8-778208ed42a2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:53:10.655042	2026-04-20
5904ee8d-7691-46f4-9b2e-0ee5aba8aad2	648bb18b-de29-40f1-99c7-604aa78004c9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:54:12.505668	2026-04-20
5f967b23-6dc6-4256-adbe-fb0f26315b51	4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:54:21.935024	2026-04-20
fc2a627a-6da9-4c67-85e5-44bb243fc7b7	c6964247-6819-4ceb-8f32-2edff9a1211b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:54:31.053964	2026-04-20
2c4b874e-b642-43ca-b34f-6421fa9c65f2	30c4ee16-9aa3-428b-82b1-0454ce8e193b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Customer is not comfortable sharing the information with us!\nSo we need to get Tango involved in the same.	\N	2026-04-17 18:54:40.981634	2026-04-20
773bbb03-b509-47cf-bdfa-d882b730107f	47d9efda-9857-4bef-bcf0-e913ebfe27c4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Gagan had a word with Omkarji for an update, but they are saying that they still havent gotten an update from the top bress for cost confirmation.	\N	2026-04-18 09:30:04.152654	2026-04-21
65c143fb-343f-4868-9521-3212a1f40d50	8ebc15b6-d903-4cf2-8096-e979dff75556	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Waiting for server room and wire work which needs to be sorted. I have asked Kenil to send an email to them and keep everything on emails	\N	2026-04-18 09:32:51.290334	2026-04-19
617027d1-cd7e-4c33-9f00-14ac82fbb084	abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Waiting for server room and wire work which needs to be sorted. I have asked Kenil to send an email to them and keep everything on emails	\N	2026-04-18 09:33:13.782555	2026-04-19
72f10918-7219-4317-874b-79272c902dfe	986f53f0-0c9e-48c2-8b93-0f752beef2ca	945ae736-dbf9-49cc-86bd-34dd74f5a84b	So we are working on this one, though this lead was brought to us by Vamsi but Tango already has knowledge about the same and he has been working with them as well.\n\nNow we have to wait and watch whether we will be able to do this or should we give it to some one else.	\N	2026-04-18 09:36:54.736398	2026-04-19
9f5bb34a-fadb-461d-9520-0380a2ecb799	fba3e183-c1d0-4337-b636-a425dd40ab4b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We need to register the company into the state authority. And then make the scope for hiring and then take things forward.	\N	2026-04-18 14:38:27.753283	2026-04-20
ded86846-979e-44d2-a253-4753d322ec37	094b9883-1dbd-4080-8868-5cfa97dba293	945ae736-dbf9-49cc-86bd-34dd74f5a84b	We are still making a Proposal for the same, and still haven't been able to close the same.	\N	2026-04-21 05:00:05.493951	2026-04-22
b19482f8-62e4-480b-97d9-a1e0d5f8ff80	2c4e1555-3429-49bf-a5b9-36b12aed73c5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Have to take a follow up from Kajal for all the sites and then get the Project on track.	\N	2026-04-21 05:01:04.281606	2026-04-22
ced14c62-a770-4c6e-8b8c-f3671936347c	09e9c70d-4a3a-4353-a66b-8c901f4f1a59	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Have to take a follow up from Kajal for all the sites and then get the Project on track.	\N	2026-04-21 05:01:22.138834	2026-04-22
95d8e425-3580-4aa3-b0c6-49680c9142bb	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Have to take a follow up from Kajal for all the sites and then get the Project on track.	\N	2026-04-21 05:01:38.263042	2026-04-23
ac791d4a-2419-4667-9074-b0594e6916b8	8362b640-2bf6-4260-b2c3-67c0ac6ef84d	945ae736-dbf9-49cc-86bd-34dd74f5a84b	During last discussion we had discussed that Apurva Bhai will get back to us!\n\nWe need to follow up again for the same!	\N	2026-04-21 05:23:07.013586	2026-04-23
680202e6-496f-4230-be82-73f2c7398f1d	74883637-2831-4ef3-a58f-e169276c0dc8	2ee5a850-f5e2-491e-9acf-799d9774cd21	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	\N	2026-04-22 04:31:30.577933	2026-04-24
68053db6-1496-4354-a7bc-dbce7f72b3a5	cb2f7179-3f4e-4526-8305-1432c98526b4	2ee5a850-f5e2-491e-9acf-799d9774cd21	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	\N	2026-04-22 04:31:42.819119	2026-04-24
56a8270e-ef2c-45b2-a49c-66a2d244c016	b1897ee5-021c-41f9-8335-2aaddb7744c5	2ee5a850-f5e2-491e-9acf-799d9774cd21	Revised proposal has been sent to them with the rate of ₹6 for Solar and ₹6 for the BESS. 	\N	2026-04-22 04:31:54.180053	2026-04-24
1f02d5f2-3e73-4156-8979-f1bb28320b4b	d07cbc73-56be-4410-8b8e-92e4ee8d755e	2ee5a850-f5e2-491e-9acf-799d9774cd21	We will receive the bills soon from them\n	\N	2026-04-22 04:32:41.569585	2026-04-24
c6f00e50-3192-4ff5-a791-a9ab8a709609	04d9bb00-7dac-47f2-a582-bb8f58c6dc23	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Negotiation is going on with both the vednor and also with the client.. there is finally a difference of 3.5 lacs.. which we need to crease out.. for which we are working.	\N	2026-04-22 10:56:34.671444	2026-04-24
22b8fea6-31ec-4b0b-a87d-488ab84ab13d	447eca51-b3c0-46a4-bce4-795c3f0fa3d9	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Negotiation is going on with both the vednor and also with the client.. there is finally a difference of 3.5 lacs.. which we need to crease out.. for which we are working.	\N	2026-04-22 10:59:02.163031	2026-04-24
addcbcb1-772d-4181-8319-3d1a9563dcda	0e9325bb-c08e-4b20-b774-494ffdd4b1b5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Waiting for the client to confirm the pricing.\n\nCurrently clients wife is in hospital so there is a delay in the confirmation!	\N	2026-04-25 08:55:08.456232	2026-04-27
2f99e337-a803-4cc3-8c4d-6422adf5d857	7f946125-9547-4b95-9d5f-707a76b55888	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Waiting for the client to confirm the pricing.\n\nCurrently clients wife is in hospital so there is a delay in the confirmation!	\N	2026-04-25 08:57:02.243848	2026-04-27
50190f14-f1e0-4e70-8867-b2e2fd533aac	6c5f43d1-eb8c-4e80-8013-619d65fe0d35	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Client needs the software, but is not in hurry as of now! so our next follow up is going to be some time in the next month.	\N	2026-04-25 08:58:46.145971	2026-05-07
ef29071b-e954-416a-b072-e5ae74176ffc	d2d30d77-9da9-4186-8a9b-dc36c88e85f2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	The lead is not very agressive in terms of tech, but the work is going on.	\N	2026-04-25 09:06:38.059586	2026-04-30
c4488417-e62b-42cd-b0f9-41f6239f96ef	0f7918e3-5203-46d9-b7fb-cd922d22c93a	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Waiting for the customer to get back with the agreement. Project is closed and in the next week we will have the agreement and then the payment.	\N	2026-04-25 09:07:44.378917	2026-04-28
369505d3-5f41-4c82-9788-e5f5476ecff7	9182a748-0dbd-41f6-a516-05f94c338204	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2 sites have been shortlisted and we have also started aquiring the same!	\N	2026-04-25 09:08:30.975946	2026-04-27
7173da22-7bef-44fd-8ea0-b637c15c2e48	08032964-787a-4e78-ae29-8e5381ed12c8	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Next follow up has to be in June or July	\N	2026-04-25 09:09:57.780274	2026-06-01
234c4ad2-750a-4662-9f48-35983fa40f50	5ac8b29a-d6b7-45fe-a007-fe1adc738640	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Chirag sir had followed up with them, and they have asked us to recheck with them in next week.	\N	2026-04-25 09:11:53.191625	2026-04-28
ecc6dbc8-ccc3-4e19-aca6-8aaf1e20f781	750770aa-eea0-4c1f-916c-42ca19b30bb1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Site is going live on 28th April, and post that the maintenance contract will go live	\N	2026-04-25 09:13:26.742902	2026-04-29
83d9350a-49e9-471b-907d-a435491bef1e	72de1f7f-7a50-471e-b30d-8993dafa8621	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Project is not going to work out for now. We have to circle back in 2 months again	\N	2026-04-25 10:55:33.133614	2026-06-10
3da6abde-065b-4365-bf46-7e78d9946b88	62fea596-e175-4ae7-8245-6f49f3d20247	945ae736-dbf9-49cc-86bd-34dd74f5a84b	This Project is closed and we have are waiting for the advance to come in from the client side.	\N	2026-04-25 10:59:58.204461	2026-04-27
5a919b62-df9a-4075-8ec1-cffb48c24bec	c6a1d81a-e922-41d1-85d2-80c947455da2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	The next follow up is going to be in next week.	\N	2026-04-25 11:08:45.924709	2026-04-30
b26570e8-d2b7-44b7-bca9-93354c0c4f4f	be8f7464-de18-40ae-8b77-6765b21b71b2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Tried reaching out to Kapil sir, but he did not answer my call.	\N	2026-04-25 11:10:06.526514	2026-04-27
11e881f3-15a4-4bd1-8a10-994b7bff05ae	7fdceaa2-686e-4986-87fd-d68acfc1fdf5	945ae736-dbf9-49cc-86bd-34dd74f5a84b	Tried reaching out to Kapil sir, but he did not answer my call.	\N	2026-04-25 11:10:21.791909	2026-04-27
\.


--
-- Data for Name: lead_value_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_value_history (id, lead_id, old_value, new_value, changed_at, changed_by, reason) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leads (id, lead_name, created_by, stage, lead_type, contact_email, phone, service_id, company, lead_owner, deal_handler, deal_value, value, follow_up_date, next_action, source_context, emotional_state, decision_role, strategic_tier, custom_hook, objection, outcome, kill_reason, internal_rating, resolved_at, friction_point, created_at, updated_at, pipeline_stage_id, pipeline_status_id, description, lead_kill_reason, final_value, value_updated_at, value_updated_by, closure_note) FROM stdin;
05511e65-fba0-4aaa-ae6d-6974584fd350	M3X - CoPilot for LMS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	warm	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Capt. Mert	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	5000000	\N	2026-04-06	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:43:06.959688	2026-04-10 15:57:06.704	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
094b9883-1dbd-4080-8868-5cfa97dba293	JKT	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	warm	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	20000000	\N	2026-04-08	Proposal to be sent for this and need to arrange a meeting for the same	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 09:58:20.693852	2026-04-21 05:00:05.553	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
8bcbb937-c382-4ec9-b083-2a3fd599fc98	M3X - Simulator (ROR)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	89633f3e-41e4-4eb8-be19-7b3181c14410	Capt. Mert	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	1000000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:35:38.291052	2026-04-10 14:53:45.223	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	289890ec-cc47-4d81-96cf-dcf32a4b3de9	\N	\N	\N	\N	\N	\N
abdd05cd-7bfa-4156-bb46-2d2dd18d2d2e	Mc Donalds	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	32006777-870b-4ae9-bf95-ce0200680f41	Bhumi Mall	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	130000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 04:45:51.736509	2026-04-18 09:33:13.83	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
de5a5c4d-1a78-4f88-ac84-f330613f373d	Ambernath Municipal Corporation	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	1f5ae568-9cbc-4a18-a26c-de4a25dcb4fb	Mr. Milind Dharwadkar	2fe65a52-f4c3-416b-b999-426704e830fd	945ae736-dbf9-49cc-86bd-34dd74f5a84b	400000.00	\N	2026-04-09	Need an AI Chat Bot for Municipal Corp. to guide people for their day to day query handling & Call to Action. Need to speak to Mr. Ashish Pavaskar (CTO)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 05:03:32.813944	2026-04-17 17:45:49.117	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
116f1a8d-bb83-40f3-bba5-447560acbde8	Nixus kinara - 127 KW	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	bb672b1f-e08a-4019-a9b0-57f3043ed8f5	TBD	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	5700000	\N	\N	Rooftop ppa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 07:05:59.639268	2026-04-02 13:34:19.731	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
62fea596-e175-4ae7-8245-6f49f3d20247	Agivant Technologies Website	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	warm	ganesh.singh@agivant.com	+91 99670 60507	fb7e6310-2add-4e55-b81e-37515fe2bd76	Agivant Technologies	f08ee1d2-e4e2-4130-8637-b1d04706af56	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	1000000.00	\N	2026-04-08	Proposal sent, they are internally discussing and will get back to us. 	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 08:46:04.479	\N	2026-04-02 07:55:54.380874	2026-04-25 10:59:58.278	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	\N	\N	\N	\N	\N	\N
126cf547-76fc-4089-95e3-7306a46193f8	Hemant Villa	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-08	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:45:37.377066	2026-04-17 18:52:16.424	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
8ebc15b6-d903-4cf2-8096-e979dff75556	Rare Rabit	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	32006777-870b-4ae9-bf95-ce0200680f41	Bhumi Mall	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	80400	\N	\N	Need 2 connections one each from Tata backbone and Siffy backbone	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 04:50:03.592214	2026-04-18 09:32:51.342	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
152d0e1f-462b-4f73-942f-cb4ec38e5c64	Bushal Chemi Pharma - 467 KW	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	TBD	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	25600000	\N	\N	Proposed captive and group captive	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 07:02:58.462762	2026-04-02 07:02:58.462762	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
b6d86451-6790-4459-8dd0-915dc697836c	Mc Donalds	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	929946e3-0d1d-40c5-bd04-50d1606cdf35	Bhumi Mall	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	50200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 04:44:49.370474	2026-04-04 08:22:14.109	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
968bd4b1-f06d-4814-a004-6d9bf16888f1	Burger King	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	32006777-870b-4ae9-bf95-ce0200680f41	Bhumi Mall	2fe65a52-f4c3-416b-b999-426704e830fd	2fe65a52-f4c3-416b-b999-426704e830fd	130000	\N	\N	We have to share the Final Quote and Brochure with the client	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 04:29:06.07892	2026-04-04 08:22:08.357	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
516f4bee-d9da-49d5-8558-19be6bb8f38e	Burger King	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot		\N	3d1bb659-6117-4b0a-8232-8b207eb44549	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f08ee1d2-e4e2-4130-8637-b1d04706af56	50200	\N	2026-04-08	Take an update from the client for the costing.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 18:24:58.526886	2026-04-10 16:02:06.047	f41ce2e9-690e-4446-9b28-a3fe0057b01c	133149e5-d199-4829-ae26-7657ebdf27d6	\N	\N	\N	\N	\N	\N
a14d2ecd-6e89-4940-8bc8-48b02a0e3a70	Pawana Hospital - 439 kW	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	d38915dc-ecf3-45f6-ad3e-874212c27666	TBD	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	24100000	\N	2026-04-10	Proposed captive and group captive	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 05:37:53.985635	2026-04-10 04:11:41.154	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
ab7e0e82-c2fc-4477-a087-299ae8c65603	Nalanda CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-06	Get Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:36:51.863728	2026-04-17 18:40:13.697	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
af1fa33a-3462-4ea2-8f61-824e37d4e8e0	M3X - AI Interview Bot	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	warm	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Capt. Mert	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2000000	\N	2026-04-06	Total 6 different Service to be given	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:45:54.862065	2026-04-10 15:56:28.665	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	\N	\N	\N	\N	\N	\N
2c4e1555-3429-49bf-a5b9-36b12aed73c5	LightStorm	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6	From LightStorm Team	3d325efb-4805-4230-ac98-d25543769e2b	3d325efb-4805-4230-ac98-d25543769e2b	1500000	\N	2026-04-08	Need to send a Profile of the Company	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 12:37:26.761724	2026-04-21 05:01:04.329	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
12064fa5-948f-419e-bd42-d10044009520	Nalanda CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-06	Get the survey done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:38:26.837596	2026-04-17 18:40:01.209	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
b9869dab-b405-4e79-b361-2daddbefcd27	Nalanda CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-06	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:39:42.111122	2026-04-17 18:39:41.853	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
7bfa59af-ab0a-4de3-a86b-d329b01ecb98	M3X - Animation Video	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	a36fb9df-3b66-44aa-ac2f-568047295bd8	Capt. Mert	ff6fb865-f4ae-4a00-865d-a9515317e382	ff6fb865-f4ae-4a00-865d-a9515317e382	150000	\N	2026-04-08	Working on the Final video delivery	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:16:41.373664	\N	2026-04-06 12:16:41.373664	2026-04-10 14:59:21.241	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	\N	\N	\N	\N	\N	\N
47d9efda-9857-4bef-bcf0-e913ebfe27c4	Jio Drones	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	3489edbd-d7a0-4368-80c0-e25dff9fcad1	TBD	18282add-4e7f-411f-bc7c-34d5ef6bef19	9f0afd4f-fea4-4740-bec1-8e39d33a988b	6000000	\N	2026-04-06	Need to get a confirmation on the costing for the Drones	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:41:00.819308	2026-04-18 09:30:04.2	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
7ffd18ef-93be-4c80-86b3-9d05c33cb35d	Nalanda CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-06	Get the survey done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 07:35:31.093999	2026-04-17 18:40:27.48	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
09e9c70d-4a3a-4353-a66b-8c901f4f1a59	LightStorm	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6	Amazon India	3d325efb-4805-4230-ac98-d25543769e2b	3d325efb-4805-4230-ac98-d25543769e2b	1000000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 12:36:26.177178	2026-04-21 05:01:22.188	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
9182a748-0dbd-41f6-a516-05f94c338204	LightStorm	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	5c8f7291-6e99-4bd8-9078-565f9d8f4ef6	Some one from the Light Storm team	3d325efb-4805-4230-ac98-d25543769e2b	3d325efb-4805-4230-ac98-d25543769e2b	2500000	\N	2026-04-08	Need to send email with Company Profile	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 12:35:31.725695	2026-04-25 09:08:31.029	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
5ac8b29a-d6b7-45fe-a007-fe1adc738640	Safewater Lines (I) Pvt. Ltd	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Apurva Thakkar	d8aed9b8-1b13-4206-9982-653bd01d0623	d8aed9b8-1b13-4206-9982-653bd01d0623	15000000	\N	2026-04-09	Need to understand there existing ERP. Meeting schedule on Tuesday 7th April 2026	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 11:44:16.907916	2026-04-25 09:11:53.238	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
c6964247-6819-4ceb-8f32-2edff9a1211b	Muldeep CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:08:08.307419	2026-04-17 18:54:31.098	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
50444fab-1804-4e27-8eb6-055a80d3d16b	Mrs. Aulivia (Investment)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e	ARI - Indonesia	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	10000000	\N	2026-04-09	Need to make a proposal for madam and then get on a call with her	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 03:13:05.018607	2026-04-10 15:38:43.742	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	55c107ac-2d68-4163-95da-af005142ebeb	\N	\N	\N	\N	\N	\N
904b4017-2e46-4684-828b-e97a813a9f2e	Neelkanth CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:20:49.301252	2026-04-17 18:49:14.625	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
c67aeea1-21e4-4d05-b6dd-ce5eb6b01713	Mrs. Aulivia (Indonesia) Drone	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	c67f6bdc-6165-45db-8544-139d1a58ae20	ARI - Indonesia	ff6fb865-f4ae-4a00-865d-a9515317e382	9f0afd4f-fea4-4740-bec1-8e39d33a988b	2500000	\N	2026-04-08	We have to give a proposal for the same	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:21:07.74754	2026-04-17 18:46:23.78	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	289890ec-cc47-4d81-96cf-dcf32a4b3de9	\N	\N	\N	\N	\N	\N
70c99eb8-65ca-4b28-bf94-39fde23c224e	Bhumi Mall - Fibre	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	0994d346-efea-47e6-ac4a-ca500ebd8c5f	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	500000	\N	2026-04-09	Have submitted the drawing as asked by the client, now waiting for the client to get back with the next steps	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 03:32:03.280252	2026-04-10 16:00:40.538	f41ce2e9-690e-4446-9b28-a3fe0057b01c	0b79d066-b90a-4a9d-a52d-fb29fd39585c	\N	\N	\N	\N	\N	\N
77855c46-d66e-4b0a-bd5b-ba87a1eda1f1	M3X - Simulator (Bridge)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	89633f3e-41e4-4eb8-be19-7b3181c14410	Capt. Mathur	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	10000000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:46:57.07599	2026-04-10 14:57:10.113	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
bbd4221d-a22e-4ba3-99f9-d7ef13d70f88	Six Star Enterprises - 540kW	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	warm	\N	\N	5b24f209-9cb7-47d5-81db-7334f3baf202	Chinmay	ff6fb865-f4ae-4a00-865d-a9515317e382	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	27000000	\N	2026-04-08	First Proposal was given and now we have to add BESS and then give them the revised proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 15:20:44.982623	2026-04-17 18:40:59.261	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
90559f16-f667-4338-8596-d77a61b5419c	Lodha (near Hiranadani)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Centaurus Charger Walkin Customer	945ae736-dbf9-49cc-86bd-34dd74f5a84b	1915618a-38c5-4473-bef8-765a5555d3f1	100000	\N	2026-04-09	Need to get in touch with the lead and have to conduct a survey	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 03:58:41.256731	2026-04-10 09:52:34.701	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
7ca6b2b6-5745-497a-8aa1-c1daaea92a4c	M3X - Inspection Tool (Ease My AI)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	ec801b35-b819-4c27-ab57-33afc0f80f15	Capt. Mert	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000	\N	2026-04-09	Have sent the Concept note to the customer, waiting for their revert	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 03:06:21.440746	2026-04-10 15:08:30.758	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
ee9652f2-8f59-4e01-805b-1da1391ed757	Muldeep CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:25:31.115351	2026-04-17 18:43:52.943	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
d3d9484d-9139-438c-938f-6d8781a4b1f1	Home Shakti CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:24:48.658989	2026-04-17 18:44:06.22	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
f232ae3a-c913-441d-8c06-21a07b35e0e9	Home Lakshmi CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:23:40.28832	2026-04-17 18:44:16.142	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
f678fd6f-ca9f-41c0-beaf-f5e56f582f3f	Hemant Villa	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:22:22.773756	2026-04-17 18:44:42.327	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
04f36275-3fa0-4ad4-aede-b47d157b0751	Home Shakti CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:18:07.111473	2026-04-17 18:50:38.626	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
b392726d-5883-4d3c-ae81-c15bddc1d370	Muldeep CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:19:00.940979	2026-04-17 18:50:19.563	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
467feba3-019e-42ec-8b65-78a2c2860368	Home Lakshmi CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:17:20.225243	2026-04-17 18:51:34.3	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
65441f98-668d-4726-b870-c41658904049	Hemant Villa	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:16:34.365425	2026-04-17 18:51:43.379	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
1636c45b-6e69-4b3e-800b-e815bd836042	Neelkanth CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-08	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:43:20.256216	2026-04-17 18:52:07.013	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
49492087-9f41-4f91-8a38-0e6d3267ce13	Muldeep CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-08	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:47:23.402518	2026-04-17 18:52:24.054	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
150ffcc0-69e1-46d8-adb9-15c8c213cadd	Home Lakshmi CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-08	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:48:54.819931	2026-04-17 18:52:31.963	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
a460194b-238e-4c45-b0c5-fc3ed0808626	Home Shakti CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-08	Conduct Survey and make a proposal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:50:28.94173	2026-04-17 18:52:44.065	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
59864d28-9491-418f-ba1d-1f0f9f53fd5d	Neelkanth CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:02:25.830149	2026-04-17 18:53:00.674	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
ef3501da-4bb1-49bb-b3b8-778208ed42a2	Hemant Villa	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:03:25.252584	2026-04-17 18:53:10.699	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
648bb18b-de29-40f1-99c7-604aa78004c9	Home Lakshmi CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:04:48.438568	2026-04-17 18:54:12.551	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
4a04dbd0-37ef-4975-a6e4-3088b4f53e3f	Neelkanth CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:14:29.731588	2026-04-17 18:54:21.983	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
30c4ee16-9aa3-428b-82b1-0454ce8e193b	Home Shakti CHS	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	50000	\N	2026-04-08	Get the Survey Done	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:05:55.50201	2026-04-17 18:54:41.025	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
6d252cc4-433a-4f06-9bd9-73250890d192	Rustomjee Township (Virar)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Shashwat sir's friend	2fe65a52-f4c3-416b-b999-426704e830fd	2fe65a52-f4c3-416b-b999-426704e830fd	1000000.00	\N	2026-04-10	We have to connect on friday 10th	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 13:27:56.034766	2026-04-14 04:18:48.885	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
feb883e7-7e03-4529-9895-874fd907b798	Bhumi Mall	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	942853e6-2ed2-4011-b09c-920cfb0f98d5	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f25282e4-45e4-4704-bac9-01214042a80b	7000000	\N	2026-04-09	Bhumi needs in all 3 GBPS mixed bandwidth for itself in Collab with TTML & Siffy	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 04:05:21.199091	2026-04-10 15:42:22.186	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
e0cebb69-f959-4be8-bf65-0f3cc56d0b7b	Axis Asset Management - 150 kW	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	warm	\N	\N	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	Nikunj ref. Charlie	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	ff6fb865-f4ae-4a00-865d-a9515317e382	8250000	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 09:46:47.324289	2026-04-14 11:03:27.705	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	Axis Asset Management having a office in One Lodha Place with 2 floors	\N	\N	\N	\N	\N
d611930d-6919-4d47-b1b6-3fe4d7cd42d0	Om CHS @ Kurla	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	87465171-dbc1-46ed-9329-82b0b0240f4d	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000	\N	2026-04-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 16:44:55.806227	2026-04-09 16:44:55.806227	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	Society where we already have an Tower setup. Over there, they also need Internet Services as well.	\N	\N	\N	\N	\N
63a40123-2216-47b7-b485-30bbc5cc7606	Om CHS @ Kurla	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	f07c9449-4526-43d2-aec8-72c53f203dcc	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000	\N	2026-04-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 16:45:59.307419	2026-04-09 16:45:59.307419	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	Society needs EV Charger for Bikes.	\N	\N	\N	\N	\N
92b6a619-2d78-4e23-bd96-e38158ee82db	Om CHS @ Kurla	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	91430904-7333-4c05-b42b-d693623a49ff	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000	\N	2026-04-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 16:46:47.091312	2026-04-09 16:47:04.452	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	Society needs CCTV services with maintenance.	\N	\N	\N	\N	\N
952792fe-29dc-4807-9e8d-71a84d09de5e	Kohinoor Eden Developers	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	2ba70d69-2120-4fe2-b30a-c093ebe13f68	Brijesh Sir's Contact	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	100000	\N	2026-04-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 14:22:59.742335	2026-04-10 04:07:52.056	f41ce2e9-690e-4446-9b28-a3fe0057b01c	133149e5-d199-4829-ae26-7657ebdf27d6	EV Charging Station required:\n1 - AC (2 guns)\n1 - AC 2 Wheeler (2 guns)	\N	\N	\N	\N	\N
1acc4207-bfa8-4903-a246-281a3dfa7f32	Panvel Municipal Corporation	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	8ce99a39-f4a5-4148-92d9-ddd5e9f61c9b	Shivaji Devte ref. Ajay sir	916e4c26-2f9f-471a-8f68-9e4a287f4169	916e4c26-2f9f-471a-8f68-9e4a287f4169	2500000	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:33:48.185689	2026-04-10 14:31:24.024	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	We need to put 25 GBM's in Panvel	\N	\N	\N	\N	\N
9d3e0877-3e47-4c65-9052-47ae7b4b5d86	Manoj Sir	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:37:07.147132	2026-04-10 04:37:07.147132	\N	\N	\N	\N	\N	\N	\N	\N
17a6fd97-6b2d-4aee-a035-28c003cc5df8	Redox Batteries	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:54:33.513151	2026-04-10 04:54:33.513151	\N	\N	\N	\N	\N	\N	\N	\N
72de1f7f-7a50-471e-b30d-8993dafa8621	Maharashtra Solar Project - 10 MW	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	8ff09bef-9f05-4577-9e8c-f92d6e883313	Bhupat Bhai	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	300000000	\N	2026-04-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 15:52:11.236706	2026-04-25 10:55:33.194	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	Need to do EPC in Maharashtra for 10 MW, though our income is going to be 30 crores but our profit margin is not going to be more then 1 crore	\N	\N	\N	\N	\N
b130926e-14dd-4672-aace-22cc049a0095	Om CHS @ Kurla - 10kW	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	550000	\N	2026-04-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 09:35:33.849539	2026-04-25 10:42:56.474	f41ce2e9-690e-4446-9b28-a3fe0057b01c	0b79d066-b90a-4a9d-a52d-fb29fd39585c	Need 10 kV Rooftop Solar for the common meter.	\N	\N	\N	\N	\N
3536b868-ba38-4482-933f-ae942e9eba9f	Rustomjee Urbania	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000	\N	2026-04-09	Need to have a discussion with Amol, for the costing and other activities	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 05:27:45.790692	2026-04-10 15:04:14.604	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	We need to put the chargers for the society for their internal use.\n\nWe already have our Telecom Setup since last 4 years and we have also taken over their CCTV Services parially and are now also targetting to take over the complete CCTV Maintenance work and others as well	\N	\N	\N	\N	\N
e2ca0c09-4118-403e-8c74-21d8b2ab7e93	Fun Limited Game Zone	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	929946e3-0d1d-40c5-bd04-50d1606cdf35	Bhumi Mall	3d325efb-4805-4230-ac98-d25543769e2b	f08ee1d2-e4e2-4130-8637-b1d04706af56	50000	\N	2026-04-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-11 13:24:54.890636	2026-04-11 13:24:54.890636	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	c201795b-05d2-4c80-af2c-f90a2b7b2425	Internet required at bhumi mall	\N	\N	\N	\N	\N
3905cbe0-c377-4cfb-a10f-22a8fd2b501b	Fab Industries - 2 MW	2ee5a850-f5e2-491e-9acf-799d9774cd21	discovery	hot	\N	\N	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	Sandeep sir	18282add-4e7f-411f-bc7c-34d5ef6bef19	945ae736-dbf9-49cc-86bd-34dd74f5a84b	60000000	\N	2026-04-06	First meeting with them is scheduled on Monday 06.04.26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 06:52:28.610163	2026-04-14 04:09:36.867	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	The owner is looking to collaborate with us for the BESS & EMS technology, he definitely needs a solution from us for their current scenarios as well.\n\nWe have to keep in mind his current Rooftop Solar and then suggest a solution keeping in mind the current solution.\n\nWe are now discussing almost 1.4 MW Solar in our Park & another 2 MW BESS either in park or on site.\n\nBut, first we do for 1 MW and then we need to scale it up from there on.	\N	\N	\N	\N	\N
e7af646f-d167-49c6-bc86-af1d56fb0e28	Bhumi Mall	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	78b74673-3266-4aaa-b18e-338e9393670d	Tango	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	15000000	\N	2026-04-09	Negotiation on the proposal is going on currently	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 03:24:56.229671	2026-04-10 15:59:07.658	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
e7687adb-5c42-41a9-9f29-568dbcf2aac9	Ashoka Buildcon (Iraj Tracker)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	\N		\N	\N	\N	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:51:30.594999	2026-04-10 14:27:51.095	\N	\N	\N	\N	\N	\N	\N	\N
0d2418e4-e6f8-45f4-8089-2b08e485baa8	Drone (Delhi - Siddharthji - Rajnath Singh)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	4507f475-1f14-4f9b-b9ba-196dc8bd57fb	Siddharth from Delhi	2fe65a52-f4c3-416b-b999-426704e830fd	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000.00	\N	2026-04-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 04:06:29.273864	2026-04-13 04:07:31.52	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	Lead has come from Delhi, Siddharthji whom we had met and was looking for Tracker for Solar Park.	\N	\N	\N	\N	\N
c9988da9-d34c-4ce7-8631-b0134dec6a17	Indore Route	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	78b74673-3266-4aaa-b18e-338e9393670d	MS Team	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	5000000.00	\N	2026-04-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-11 06:54:03.90091	2026-04-13 04:08:24.027	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	EV Charging Station on multiple routes & Partnership model with Fleets.	\N	\N	\N	\N	\N
92b7daa3-16af-4b69-a3e6-d40ec1135b3c	RVNL Dashboard Project	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	cold	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Nitin sir	d8aed9b8-1b13-4206-9982-653bd01d0623	d8aed9b8-1b13-4206-9982-653bd01d0623	10000000	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 15:11:23.115128	2026-04-13 06:59:55.09	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	605c2f58-7dd4-4a77-af99-eb80f5e7405d	Need a Dashboard for RVNL Board of Directors	\N	\N	\N	\N	\N
2df58b0f-8c32-4f2c-b404-a50eab8b1623	Rustomjee Township (Virar)	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	Shashwat sir's friend	2fe65a52-f4c3-416b-b999-426704e830fd	2fe65a52-f4c3-416b-b999-426704e830fd	100000.00	\N	2026-04-09	Need to have a meeting with him on Friday 10th	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 13:25:07.423621	2026-04-14 04:19:06.597	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
8f850381-4730-494a-9eb7-e25bff06898d	Bhandarkar & Blue Stratum Partnership	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Meghraj sir	ff6fb865-f4ae-4a00-865d-a9515317e382	945ae736-dbf9-49cc-86bd-34dd74f5a84b	1000000.00	\N	2026-04-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:32:59.653865	2026-04-18 09:44:49.463	f41ce2e9-690e-4446-9b28-a3fe0057b01c	0b79d066-b90a-4a9d-a52d-fb29fd39585c	On certain Marine Projects like ROR Simulator, Cadet Book Tab, etc. we can collaborate and work together by having Bhandarkar sir with minority stack and do business together.	\N	\N	\N	\N	\N
9c4532c2-3192-4d0e-ace3-98f7122d0e0c	MMTM	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Capt. Vivek Bhandarkar	d8aed9b8-1b13-4206-9982-653bd01d0623	d8aed9b8-1b13-4206-9982-653bd01d0623	200000	\N	2026-04-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 06:07:13.362731	\N	2026-04-13 06:07:13.362731	2026-04-13 06:07:13.362731	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Need to make changes in existing application	\N	\N	\N	\N	\N
34187200-4dbe-4838-bd92-1cd25ab3a743	Ritesh Bhai Rajasthan - 10 MW	6f65730a-b2a4-475c-9ffe-45f4f7347b97	discovery	hot	\N	\N	842e6e02-1157-44b5-8857-e195f516808a	Bhupat Bhai	3d325efb-4805-4230-ac98-d25543769e2b	945ae736-dbf9-49cc-86bd-34dd74f5a84b	350000000	\N	2026-04-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 15:48:57.555819	2026-04-13 13:36:45.98	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	10/04/26:\nPPA work is coming @3.90/- per unit. We have to do land, connectivity and Implementation.\nThe company is BBB+ and above.\n\n13/04/26:\nSo as per today's discussion we have reviewed the PPA to INR. 4.10/- Per unit 	\N	\N	\N	\N	\N
d066598e-e4d8-4bf2-94af-498f161a337d	MSEDL Liasoning ref. Tango	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:43:16.356489	2026-04-15 12:43:16.356489	\N	\N	\N	\N	\N	\N	\N	\N
dc016f34-4d8b-43b4-be65-eb6060f8cb43	The Walk Green Meter - Liasoning	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:46:43.740981	2026-04-15 12:46:43.740981	\N	\N	\N	\N	\N	\N	\N	\N
ad749e5e-173b-4ba9-ae0b-ac37d8b4d84b	Shopper Stop (8 Locations) 	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	9425ef07-2954-4826-b0f5-fdf28143a86d	\N	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:40:37.954052	2026-04-16 15:40:37.954052	\N	\N	\N	\N	\N	\N	\N	\N
947522b5-7459-4bf9-9dc5-5a6ed2153c91	Falcon	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:41:16.141475	2026-04-16 15:41:16.141475	\N	\N	\N	\N	\N	\N	\N	\N
5f12c08d-3382-4b98-9341-25748734d63d	M3X - 3rd Party Animation Videos	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	a36fb9df-3b66-44aa-ac2f-568047295bd8	Capt. Mert from Turkey	ff6fb865-f4ae-4a00-865d-a9515317e382	ff6fb865-f4ae-4a00-865d-a9515317e382	1500000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 13:08:45.204	\N	2026-04-15 13:04:20.861406	2026-04-15 13:08:45.204	bd2c3618-323a-4bf5-aa87-cf4224c48185	5c7631b4-d245-4a98-b861-e610c69e0c10	3rd Party Videos from a local vendor to be purchased and then selling it to our M3X Partners.	\N	\N	\N	\N	\N
9841d159-eabb-4cca-a5e7-838a3424c763	Chiplun EV Charging Station	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	06ee0b9c-a578-4e50-a717-56470e283899	Ref. Brijesh sir refrence	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	100000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 15:35:12.186222	2026-04-15 15:35:12.186222	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	605c2f58-7dd4-4a77-af99-eb80f5e7405d	A new Resort coming up in Chiplun and the owner wants an EV Charging set up for the same. Both the options are open on the Investment front.	\N	\N	\N	\N	\N
aec25480-c9b3-41c6-8201-0b5cce2c6731	Req. For 10000 Laptops	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	759f4732-33bf-4e51-88ca-991ec52f4c15	Ref. Tango	3d325efb-4805-4230-ac98-d25543769e2b	1915618a-38c5-4473-bef8-765a5555d3f1	10000000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 15:41:16.448738	2026-04-15 15:41:16.448738	f41ce2e9-690e-4446-9b28-a3fe0057b01c	0b79d066-b90a-4a9d-a52d-fb29fd39585c	Govt. Requirement for 10,000 laptops.	\N	\N	\N	\N	\N
7ec4a9c9-cd12-4747-83f1-a9e15e3a08a7	Lake Shore - 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:34:50.05816	2026-04-16 15:34:50.05816	\N	\N	\N	\N	\N	\N	\N	\N
638fa2a2-6e07-462c-a2b1-223bad1c41cc	Dosti - EV Charger	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:35:44.036893	2026-04-16 15:35:44.036893	\N	\N	\N	\N	\N	\N	\N	\N
1eb66b8e-4751-4379-b459-7baf72c83d75	Dosti - Rooftop	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:35:55.256862	2026-04-16 15:35:55.256862	\N	\N	\N	\N	\N	\N	\N	\N
003dae3a-7633-4615-a1a9-182e7c162620	Rustomjee Urbania	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:38:28.052595	2026-04-16 15:38:28.052595	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
22fa24eb-38ae-4efd-b49a-e7c1905d891d	Chattisgarh - PPA (Rooftop)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:45:15.788494	2026-04-16 15:45:36.524	\N	\N	\N	\N	\N	\N	\N	\N
733a2cbb-18c5-4776-b394-e71308028c23	Bhumi Mall - Food App	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:47:12.08919	2026-04-16 15:47:12.08919	\N	\N	\N	\N	\N	\N	\N	\N
bef3049b-d18e-4e71-bb91-cb01d1193eac	Hi Design	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	3d1bb659-6117-4b0a-8232-8b207eb44549	Tango	3d325efb-4805-4230-ac98-d25543769e2b	f08ee1d2-e4e2-4130-8637-b1d04706af56	50200	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:48:45.78683	2026-04-16 15:48:45.78683	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	\N	\N	\N	\N	\N	\N
aeb87c95-35b0-4d8f-9236-bedd3d2c17e4	Hiranandani Panvel - EV Charging	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:50:41.987002	2026-04-16 15:50:41.987002	\N	\N	\N	\N	\N	\N	\N	\N
4fe8b176-1cba-489d-a494-b7c73a4c45aa	Hiranandani Kandivali	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:50:59.397809	2026-04-16 15:50:59.397809	\N	\N	\N	\N	\N	\N	\N	\N
38f0b924-cbe9-4aef-a8b9-0b355a785f54	Gabi Plastice - Solar	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:51:40.377605	2026-04-16 15:51:40.377605	\N	\N	\N	\N	\N	\N	\N	\N
e936f816-ab67-455b-9632-68becc921fc4	Gabi Industrial Park - EV Charging Station	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:52:10.672076	2026-04-16 15:52:10.672076	\N	\N	\N	\N	\N	\N	\N	\N
f5bc213d-ddf9-43f9-bf9c-130a56c53a53	Zomato - Ev Charging Station	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:52:34.729487	2026-04-16 15:52:34.729487	\N	\N	\N	\N	\N	\N	\N	\N
f004884c-3a2e-4b24-b6bf-7fe71e92f3fd	Zomato - Solar 2 MW	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:52:48.979156	2026-04-16 15:52:48.979156	\N	\N	\N	\N	\N	\N	\N	\N
9f98e525-e6d3-40f3-9139-558a4094fc90	Rodas Enclave - EV Charging Station	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:56:48.351391	2026-04-16 15:56:48.351391	\N	\N	\N	\N	\N	\N	\N	\N
118439f6-8c92-4b1f-a531-5e22fbfe8dd9	Hiranandani School - Solar (95 kV)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:57:50.838439	2026-04-16 15:57:50.838439	\N	\N	\N	\N	\N	\N	\N	\N
45bf4fde-465b-4d31-815b-e31d7fe9d0e4	G.S. Shetty - Solar	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:58:24.887411	2026-04-16 15:58:24.887411	\N	\N	\N	\N	\N	\N	\N	\N
aaf28eca-9e53-43e3-9da1-c1b653fa5a09	Bhandarkar - ROR Simulator	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:59:52.059342	2026-04-16 15:59:52.059342	\N	\N	\N	\N	\N	\N	\N	\N
c4bb6605-fc77-4508-b63d-80a08b12cbbe	Om CHS @ Kurla - 10kW (OneTracker)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	c046ed7f-90c1-485b-8217-df682260b199	Shashi Dada	1915618a-38c5-4473-bef8-765a5555d3f1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	150000.00	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 16:02:07.990667	2026-04-16 16:02:07.990667	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
c9e12414-6ed7-4eb6-a577-356527a14f87	Shopper Stop (8 Locations)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	\N	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	10000000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:07:05.365382	2026-04-17 16:17:36.402	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	\N	\N	\N	\N	\N	\N
c6cff992-d1c9-4aa9-8c99-f854a7e2202d	Incident Recreation Simulator	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	89633f3e-41e4-4eb8-be19-7b3181c14410	Ref. 	ff6fb865-f4ae-4a00-865d-a9515317e382	ff6fb865-f4ae-4a00-865d-a9515317e382	100000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:42:17.093005	2026-04-17 17:48:19.104	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	55c107ac-2d68-4163-95da-af005142ebeb	Need to take a brief from Meghraj sir for the same.	\N	\N	\N	\N	\N
823d8a28-e746-4023-88f5-1658d8e931cb	Navin Asha CHS	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	995e2778-542e-48b6-8c92-16284e2acfe4	\N	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	945ae736-dbf9-49cc-86bd-34dd74f5a84b	50000.00	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 16:04:34.625126	2026-04-17 17:16:42.37	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
c6a1d81a-e922-41d1-85d2-80c947455da2	Allianz CHS	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	e6e731ee-4067-4e3b-9c7b-99ce75838b48	2500000.00	18282add-4e7f-411f-bc7c-34d5ef6bef19	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2500000.00	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:42:16.945639	2026-04-25 11:08:45.999	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	\N	\N	\N	\N	\N	\N
69c8a138-ff83-4d1a-890f-1472e596e08e	Kalpatharu Solar (875 kW)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:59:04.916826	2026-04-22 04:38:26.321	\N	\N	\N	\N	\N	\N	\N	\N
fb8adc33-72fe-4a21-aedf-56939d0252a7	Lake Shore - 1 (Himri Mall)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N		\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:34:22.659379	2026-04-20 11:05:38.2	\N	\N	\N	\N	\N	\N	\N	\N
8362b640-2bf6-4260-b2c3-67c0ac6ef84d	Lead MS for KIT	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	\N	Ref. Apurva	d8aed9b8-1b13-4206-9982-653bd01d0623	945ae736-dbf9-49cc-86bd-34dd74f5a84b	85000	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:47:27.758896	2026-04-21 05:24:30.68	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	Lead Management System	\N	\N	\N	\N	\N
d07cbc73-56be-4410-8b8e-92e4ee8d755e	Piramal - Tower 4	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N		\N	\N		\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:37:22.678764	2026-04-22 04:32:41.615	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	\N	\N	\N	\N	\N	\N
3cb1c833-b7af-4317-b47c-7d49440ee68d	Zari Embroideries	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Ref. Divij	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	1000000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 06:59:01.45	\N	2026-04-15 12:10:46.980636	2026-04-23 06:59:01.45	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Building an Custom ERP for Zari Business.	\N	\N	\N	\N	\N
04d9bb00-7dac-47f2-a582-bb8f58c6dc23	Bhumi Mall - Rooftop Solar 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	29cc66aa-92e8-408a-9da3-84bdaacf9b73	\N	3d325efb-4805-4230-ac98-d25543769e2b	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:43:15.819957	2026-04-22 10:56:34.72	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
447eca51-b3c0-46a4-bce4-795c3f0fa3d9	Bhumi Mall - Rooftop Solar 1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	29cc66aa-92e8-408a-9da3-84bdaacf9b73	\N	3d325efb-4805-4230-ac98-d25543769e2b	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	\N	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:43:04.768121	2026-04-22 10:59:02.209	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	\N	\N	\N	\N	\N	\N
6baaf530-8d70-4279-a904-a759a773f176	JioStar	d8aed9b8-1b13-4206-9982-653bd01d0623	discovery	hot	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Cnergyis	d8aed9b8-1b13-4206-9982-653bd01d0623	d8aed9b8-1b13-4206-9982-653bd01d0623	210000	\N	2026-04-19	Closed on 2.1Lac	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 06:42:58.682418	\N	2026-04-17 06:42:58.682418	2026-04-17 06:42:58.682418	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Need to Create Astral Claim type	\N	\N	\N	\N	\N
7cde05b5-c42e-4781-9aaf-120cf346993e	Solapur Solar Park - Evluation	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	aa93e14e-1009-4045-8ba5-6be63bea2035	Ref. Tambde Sir	18282add-4e7f-411f-bc7c-34d5ef6bef19	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 09:14:34.765141	2026-04-17 16:16:06.663	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	There is a 40 acres land with one of our reference and the new sub station is bring construted and at a distance at 3 kms. So we are trying to get a connectivity for the same.	\N	\N	\N	\N	\N
7fdceaa2-686e-4986-87fd-d68acfc1fdf5	Dehradhun Software Tender - 1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Ref. Kapil Bhatti	f08ee1d2-e4e2-4130-8637-b1d04706af56	d2218768-ed36-496d-86fa-34ae48a66111	30000000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:08:16.318836	2026-04-25 11:35:27.381	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	Tender has been brought to us by Kapil sir, these are AI Projects. Which have to be executed accordingly.	\N	\N	\N	\N	\N
bd22a8c8-e6e4-4acc-ba29-201b7a9c7ea0	Solapur Petrol Pump	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	06ee0b9c-a578-4e50-a717-56470e283899	Ref. Tambde Sir Friend	18282add-4e7f-411f-bc7c-34d5ef6bef19	1915618a-38c5-4473-bef8-765a5555d3f1	149999	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 09:13:52.65934	2026-04-17 16:22:38.699	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	He is already building a Petrol Pump in that location and is also doing the work for CNG as well. He is also considering doing work for EV Charging Station as well. \n\nWe have suggested him to also do a partner ship with a Restaurant Person also there, as he has immense place there to work upon.	\N	\N	\N	\N	\N
be8f7464-de18-40ae-8b77-6765b21b71b2	Dehradhun Software Tender - 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Ref. Kapil Bhatti	f08ee1d2-e4e2-4130-8637-b1d04706af56	d2218768-ed36-496d-86fa-34ae48a66111	35000000.00	\N	2026-04-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:29:05.605668	2026-04-25 11:35:39.123	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	Tender has been brought to us by Kapil sir, these are AI Projects. Which have to be executed accordingly.	\N	\N	\N	\N	\N
bdb3a7c1-12df-4f09-9943-a0bafaf2a69f	Agreement Tracker (HoH)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	\N	Ref. Martin Sir	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	945ae736-dbf9-49cc-86bd-34dd74f5a84b	500000.00	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 09:26:40.236679	2026-04-18 09:26:40.236679	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	289890ec-cc47-4d81-96cf-dcf32a4b3de9	Agreement Tracker Software requirement	\N	\N	\N	\N	\N
35f080db-23b6-4fa7-912c-f1956d9d40ee	HDD	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	\N	\N	\N	\N	18000000.00	\N	2026-04-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 16:49:26.797343	2026-04-17 16:50:07.573	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	\N	\N	\N	\N	\N	\N
679d5f91-d1f0-4032-b902-32fefd074e7e	HDD - 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	\N	\N	\N	\N	5000000.00	\N	2026-04-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 16:51:40.861857	2026-04-17 16:51:40.861857	f41ce2e9-690e-4446-9b28-a3fe0057b01c	\N	\N	\N	\N	\N	\N	\N
97c58426-102a-4aca-a632-9cca4c645c89	Lacoste	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	\N	‪+91 82862 28177‬	929946e3-0d1d-40c5-bd04-50d1606cdf35	Bhumi Mall	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	50000	\N	2026-04-20	share proposal and close the deal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 18:35:08.267318	2026-04-17 18:35:08.267318	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	internet and landline connection	\N	\N	\N	\N	\N
08032964-787a-4e78-ae29-8e5381ed12c8	Soreze Care Shopify Website	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	cold	chinmay@amaterasu.in	8072736408	0105c096-8300-48db-8e1c-ff00e7b89162	Chinmay	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	100000	\N	2026-05-31	client will initiate discussion in June	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:56:01.24624	2026-04-25 09:09:57.828	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	b172d3ba-af51-411b-9d60-5113d266d5c8	Develop Shopify Website	\N	\N	\N	\N	\N
84409426-1c97-40b1-9525-014bc4cc72c8	RenewXYZ	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	8ce1718d-db24-4acc-a9df-f530ff491c70	Ref. Vodafone Idea	945ae736-dbf9-49cc-86bd-34dd74f5a84b	9f0afd4f-fea4-4740-bec1-8e39d33a988b	10000000.00	\N	2026-04-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 12:09:03.334671	2026-04-17 17:37:42.91	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	289890ec-cc47-4d81-96cf-dcf32a4b3de9	We are designing a solution where we can produce RTC Green Power for Telecom setup.\n\nWhich will comprise of both Solar (OneTracker) & Wind Turbine. \n\nThe first POC for the same will take place in Mumbai in a society OM CHS, where we have a Vi Site.	\N	\N	\N	\N	\N
d9eec539-ec45-4733-9991-fa85691b0f4e	Mahavir ref. Brijesh sir and Shashi Dada	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 18:58:36.754919	2026-04-17 18:58:36.754919	\N	\N	\N	\N	\N	\N	\N	\N
24d15bb7-20b2-4997-8b09-5b7a2ebbe792	Cattle Mobile App	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	prabir.mehta@icicilombard.com	9819797452	89dc799c-08b0-41a6-b9c8-5ea9d2f3ce50	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	3000000	\N	2026-04-20	need to get the Quotation digitally signed.	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:30:45.622	\N	2026-04-17 17:14:54.890009	2026-04-17 17:30:45.622	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Develop Mobile App on Flutter	\N	\N	\N	\N	\N
b59f8570-d8f3-4c21-8572-bbd9ee5c2ae2	Pranique Shopify Website	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	zenessinternational@gmail.com	8591036261	0105c096-8300-48db-8e1c-ff00e7b89162	Hardik Shah	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	85000	\N	2026-04-19	start website development	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:46:39.028078	\N	2026-04-17 17:46:39.028078	2026-04-17 17:46:39.028078	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Development of Shopify Website	\N	\N	\N	\N	\N
4264ecb0-06f9-466c-a130-35b04dc7d437	Sero Jewels	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	vineet@fridaytalkies.com	9136350007	0105c096-8300-48db-8e1c-ff00e7b89162	Vineet Rai	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	100000	\N	2026-04-19	Awaiting advance from client	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:48:20.543625	\N	2026-04-17 17:48:20.543625	2026-04-17 17:48:20.543625	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Development Shopify Website	\N	\N	\N	\N	\N
beb62bde-2124-4e66-b727-e268e8870af8	Crossword	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	929946e3-0d1d-40c5-bd04-50d1606cdf35	Ref. Bhumi Mall	3d325efb-4805-4230-ac98-d25543769e2b	f08ee1d2-e4e2-4130-8637-b1d04706af56	55000.00	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 09:34:51.986763	2026-04-18 09:34:51.986763	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	\N	\N	\N	\N	\N	\N
986f53f0-0c9e-48c2-8b93-0f752beef2ca	PPA in Maharashtra @ INR. 4.70/- 	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	842e6e02-1157-44b5-8857-e195f516808a	Vamsi sir	3d325efb-4805-4230-ac98-d25543769e2b	f08ee1d2-e4e2-4130-8637-b1d04706af56	10000000.00	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 14:03:52.85091	2026-04-18 09:38:52.027	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	45*1.3 13 @4.70 Solapur	\N	\N	\N	\N	\N
0f7918e3-5203-46d9-b7fb-cd922d22c93a	Credilla	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	dhawal@credila.com	8329212918	6dbce491-e66f-4cf4-a3ce-bfbf287a750e	DigiXpressions Media	f08ee1d2-e4e2-4130-8637-b1d04706af56	d2218768-ed36-496d-86fa-34ae48a66111	6600000	\N	2026-04-20	need to confirm agreement with them 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:08:37.267181	2026-04-25 09:07:44.425	f41ce2e9-690e-4446-9b28-a3fe0057b01c	133149e5-d199-4829-ae26-7657ebdf27d6	\N	\N	\N	\N	\N	\N
0e9325bb-c08e-4b20-b774-494ffdd4b1b5	Turquoise Aura	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	warm	vineet@fridaytalkies.com	9136350007	0105c096-8300-48db-8e1c-ff00e7b89162	Vineet Rai	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	100000.00	\N	2026-04-27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 18:18:18.858472	2026-04-25 08:55:08.505	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	Development of Shopify Website	\N	\N	\N	\N	\N
d2d30d77-9da9-4186-8a9b-dc36c88e85f2	Malabar Club	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	warm	payal@malabarclub.com	8928645710	89dc799c-08b0-41a6-b9c8-5ea9d2f3ce50	Ajeetav Nayak	f08ee1d2-e4e2-4130-8637-b1d04706af56	d2218768-ed36-496d-86fa-34ae48a66111	50000.00	\N	2026-04-20	Connect with the IT manager of the Club	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:51:03.311897	2026-04-25 09:06:38.11	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	Develop Mobile Application for Malabar Club	\N	\N	\N	\N	\N
750770aa-eea0-4c1f-916c-42ca19b30bb1	Inventia website maintenance	f08ee1d2-e4e2-4130-8637-b1d04706af56	discovery	hot	mamta@inventia.com	9029496268	44180603-9ea9-48ca-9d20-b4c5022884bc	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	300000	\N	2026-04-27	waiting for website closure from our team and then this initiates	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 17:04:07.744727	2026-04-25 09:13:26.791	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	Annual Maintenance Contract	\N	\N	\N	\N	\N
fba3e183-c1d0-4337-b636-a425dd40ab4b	Rooftop Solar for Residential Homes	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	aef2244f-3332-4ccb-b1ba-e4ead56633c2	HR Shah	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	100000.00	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 14:37:01.688104	2026-04-18 14:38:27.805	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	da1f2527-5e1b-4754-a3f8-3ae175e35b81	New business opportunity, where we can do subsidised rooftop work for residential homes. Starting from 3kV to 10kV.	\N	\N	\N	\N	\N
fb55e5c8-9901-4f13-a53c-4677f2809680	HDD - 1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 21:35:32.558816	2026-04-18 21:35:32.558816	\N	\N	\N	\N	\N	\N	\N	\N
c1fcb60d-b791-4f14-b575-aa6feafa63a8	HDD - 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 21:35:44.830524	2026-04-18 21:35:44.830524	\N	\N	\N	\N	\N	\N	\N	\N
8e5c39e3-7157-4a36-9fc5-bc4770e0fd0c	13.1 MW PPA @ 3.35 (Rajasthan)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 21:36:45.234942	2026-04-18 21:36:45.234942	\N	\N	\N	\N	\N	\N	\N	\N
4e36e760-13d0-4405-844a-03f9c372d12e	20 MW PPA @ 3.30 (Rajasthan)	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 21:38:13.901703	2026-04-18 21:38:13.901703	\N	\N	\N	\N	\N	\N	\N	\N
13e18365-f746-4201-b770-52b86f09a964	Gadchiroli Minning	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 12:21:17.055793	2026-04-19 12:21:17.055793	\N	\N	\N	\N	\N	\N	\N	\N
0d929bc8-4a76-483e-9559-d3f296d777e0	Nashik Drone - Cell on Wings	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 12:21:38.08385	2026-04-19 12:21:38.08385	\N	\N	\N	\N	\N	\N	\N	\N
b012c326-bcf9-4590-ae06-abd231f73057	Raheja universal - solar, ev, ibs, ftth	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 12:20:55.592345	2026-04-19 12:22:07.586	\N	\N	\N	\N	\N	\N	\N	\N
dc7a3761-cfe4-4fc0-a262-794bc31af50c	IBS related business opportunity with 3 years ROI	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 12:22:51.50744	2026-04-19 12:22:51.50744	\N	\N	\N	\N	\N	\N	\N	\N
53edfb3f-50e4-449f-a41f-cbeab874ae77	Raise Funds - Project CMMN	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e	Ref. Vamsi	f08ee1d2-e4e2-4130-8637-b1d04706af56	945ae736-dbf9-49cc-86bd-34dd74f5a84b	100000000	\N	2026-04-23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21 04:57:38.938221	2026-04-21 04:57:38.938221	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	2eca1b84-280a-49da-a529-deeb563a9167	Raising funds for Project CMMN using a new method.	\N	\N	\N	\N	\N
7f946125-9547-4b95-9d5f-707a76b55888	Sero Jewels Shopify Website	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	vineet@fridaytalkies.com	9136350007	0105c096-8300-48db-8e1c-ff00e7b89162	Vineet Rai	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	100000.00	\N	2026-04-27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 08:56:51.200631	2026-04-25 08:57:02.292	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	Shopify website work is still going on!	\N	\N	\N	\N	\N
6c5f43d1-eb8c-4e80-8013-619d65fe0d35	Divej - HRMS	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	b6b20be1-7162-49d3-bb9a-e32a5770649c	Ref. Rudraksh	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	1000000.00	\N	2026-04-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 08:51:24.81642	2026-04-25 08:58:46.192	f41ce2e9-690e-4446-9b28-a3fe0057b01c	0b79d066-b90a-4a9d-a52d-fb29fd39585c	Custom HRMS development required.	\N	\N	\N	\N	\N
62455f46-dee0-41c7-9f27-2d9a88253a0f	Yes Securities - Cyclothon	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	fb7e6310-2add-4e55-b81e-37515fe2bd76	Ref. Yes	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	550000.00	\N	2026-04-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 09:03:54.740285	2026-04-25 09:03:54.740285	f41ce2e9-690e-4446-9b28-a3fe0057b01c	133149e5-d199-4829-ae26-7657ebdf27d6	Website worth INR. 2.5 lacs and then 25k per month maitenance.	\N	\N	\N	\N	\N
294cd38f-b922-46fe-8772-63fc6edc3983	Yes Securities - Manthan	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	hot	\N	\N	fb7e6310-2add-4e55-b81e-37515fe2bd76	Ref. Yes	f08ee1d2-e4e2-4130-8637-b1d04706af56	f08ee1d2-e4e2-4130-8637-b1d04706af56	175000.00	\N	2026-04-27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 09:05:03.724848	\N	2026-04-25 09:05:03.724848	2026-04-25 09:05:03.724848	bd2c3618-323a-4bf5-aa87-cf4224c48185	0d1682a0-923b-4762-96f9-980f2f6a4d10	Website making	\N	\N	\N	\N	\N
74883637-2831-4ef3-a58f-e169276c0dc8	Piramal - Tower 3	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	5b24f209-9cb7-47d5-81db-7334f3baf202		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	10159173	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:37:12.769327	2026-04-22 04:31:30.632	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	Piramal society Tower 3 - Proposing them open access for 169kW, as they already have the rooftop solar. 	\N	\N	\N	\N	\N
cb2f7179-3f4e-4526-8305-1432c98526b4	Piramal - Tower 1	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	5b24f209-9cb7-47d5-81db-7334f3baf202		7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7800000	\N	2026-04-18		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:36:46.371022	2026-04-22 04:31:42.868	f41ce2e9-690e-4446-9b28-a3fe0057b01c	3fc91a6f-aa0a-434b-868f-f39f68162166	Piramal society Tower 1 - Proposing them open access for 130kW, as they already have the rooftop solar. 	\N	\N	\N	\N	\N
b1897ee5-021c-41f9-8335-2aaddb7744c5	Piramal - Tower 2	945ae736-dbf9-49cc-86bd-34dd74f5a84b	discovery	warm	\N	\N	5b24f209-9cb7-47d5-81db-7334f3baf202	\N	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	7800000	\N	2026-04-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 15:37:00.77667	2026-04-22 04:31:54.228	f41ce2e9-690e-4446-9b28-a3fe0057b01c	bd727ac7-e507-428e-99d0-30a0fd602750	Piramal society Tower 2 - Proposing them open access for 130kW	\N	\N	\N	\N	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used) FROM stdin;
8cc929f7-e463-4780-8058-5b608eb31b0e	6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	1dcd58f9-d1e1-4c8e-9005-10920d5b491d	2026-03-31 10:15:56.621	f
0733f4eb-b585-4516-9205-ff05cadec58f	2db3bd18-6b0f-4992-b783-47a05c8f630c	c31f24c1-1a96-4498-8232-753efca08b7a	2026-03-31 10:23:02.158	t
17122253-ae75-44c6-a04c-598e5f691a47	e48cf338-0e13-40af-a9fb-9d54797b85c4	84e4b626-0f59-4543-b6ad-b91c59efade2	2026-03-31 10:26:26.859	f
6610c0b6-b85d-4b8b-b1cb-fbc0237e5c73	2fe65a52-f4c3-416b-b999-426704e830fd	3b6dfbb7-7387-4d5a-b8b8-9c30f9f77535	2026-04-03 04:33:38.075	t
3439d395-1d58-415a-8b4d-56295b617efa	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	f5656967-835e-45f0-a6f7-f318e292a959	2026-04-03 05:47:17.902	f
da023ae7-2997-4ef2-95a2-dec0e114beda	2ee5a850-f5e2-491e-9acf-799d9774cd21	70708eab-6647-46a0-8ede-09f0c23bfb05	2026-04-03 04:36:41.086	t
39bab669-7de9-4ec7-9297-f82ae482a0fc	18282add-4e7f-411f-bc7c-34d5ef6bef19	ca65687b-81f9-4ad2-8a3c-77b8e7e71809	2026-04-03 07:10:24.245	f
8e9f56c2-8199-4aea-8d5a-b2261a2da0eb	ff6fb865-f4ae-4a00-865d-a9515317e382	2c8dff03-dc97-46c1-8ab2-7d7617574698	2026-04-03 07:10:58.638	f
06c0d883-ec28-4f62-8a26-a42b7eb6cdc4	3d325efb-4805-4230-ac98-d25543769e2b	f3f8b5a4-906d-4e12-a41d-926ee52fb7c2	2026-04-03 07:11:39.205	f
1b4d6139-6fa3-4c38-b054-31347b66312c	f08ee1d2-e4e2-4130-8637-b1d04706af56	b1b94a44-5291-473f-8406-5b83fefe0a4f	2026-04-03 07:07:43.519	t
b1f88d9b-652b-41b4-b74d-742570e102d1	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	540ddb90-ffd2-41a0-bff5-7a7a30b10ad3	2026-04-03 07:08:54.466	t
5a22153e-50bc-4ce4-85ef-dae6307e4e64	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	5032233f-1a99-4b13-a78b-37075f84741b	2026-04-04 05:32:33.144	f
2e5c8316-d590-4e29-bd9f-47ed326d41e6	8a0aa7ae-6fa3-4b61-af77-f3132beb1515	e68e4415-47a9-4fa1-93c2-44b155ceb9eb	2026-04-04 05:33:58.739	f
0b498e5c-915d-43e0-9fab-816988e3d8b4	d2218768-ed36-496d-86fa-34ae48a66111	b41aca50-1470-4f2b-ac3f-2c622156e866	2026-04-04 05:34:36.625	f
e2fb3c0e-0311-4a2c-94d5-ecd1aef2c649	1915618a-38c5-4473-bef8-765a5555d3f1	89149f13-b0bd-442e-bcf1-0a07f5bc8a1a	2026-04-04 05:36:01.989	f
ff920c93-06ec-4af2-9fcc-9959c675ecb1	9f0afd4f-fea4-4740-bec1-8e39d33a988b	a7a85259-cba4-47ba-84dd-5da4f02c08ff	2026-04-04 05:37:52.122	f
9cc0ed2f-dede-40b7-adc3-f67dcce30df8	7ea66e43-0d18-429b-8946-63c75984a568	c49590ba-69a6-45bf-a51d-cb892129b765	2026-04-04 05:38:46.021	f
3ce27c29-40ed-417b-9de3-8b3b91a83685	f25282e4-45e4-4704-bac9-01214042a80b	fe6f5db2-a4b7-4584-b93d-b9d6f4ab712f	2026-04-04 05:39:33.225	f
82baef2a-9b2b-40b3-9820-109c9c3aa75b	8000364a-2928-4781-8b70-4061b25b53ff	d5fbfc6f-89a9-4399-b844-22d26f7d8f5b	2026-04-04 05:42:24.635	f
d324158f-0612-4412-9af2-d92e896151de	8a0aa7ae-6fa3-4b61-af77-f3132beb1515	3ecef554-0fa3-4f47-9479-355096dcc737	2026-04-07 13:36:31.845	f
c456b157-48f3-47d4-a12d-118320a07d3d	916e4c26-2f9f-471a-8f68-9e4a287f4169	1906b821-1338-402d-930e-bab53f8f11d1	2026-04-11 14:27:48.693	f
35453663-d69b-46d9-8204-d1a85c962ded	945ae736-dbf9-49cc-86bd-34dd74f5a84b	930ba54a-83d9-4e1a-83bd-7bf03b6b72fa	2026-04-03 04:53:51.318	t
05a45af2-106d-4536-865c-5030ed040269	945ae736-dbf9-49cc-86bd-34dd74f5a84b	7d7d057c-9e8d-4d46-98cf-b6311a5a8213	2026-04-14 15:52:04.986	t
d5928f8b-297a-4765-90d8-970d8a1370c9	d8aed9b8-1b13-4206-9982-653bd01d0623	4d9e4e56-8369-4645-b610-5b4a141e50ac	2026-04-02 14:32:14.327	t
def039c5-a203-4441-b2f8-f2c131c690c4	d8aed9b8-1b13-4206-9982-653bd01d0623	27d1a341-c0da-461f-a131-1811d2a47399	2026-04-18 17:17:01.815	t
f8332ce3-0840-4445-a5ca-e3aa91c2b2b1	d8aed9b8-1b13-4206-9982-653bd01d0623	c48c1052-abb0-46e5-82f2-0992ede356bf	2026-04-18 17:17:04.623	f
\.


--
-- Data for Name: pipeline_stages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pipeline_stages (id, name, display_name, description, color, icon, sort_order, is_active, is_terminal, created_at, updated_at) FROM stdin;
04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	lead_initiation	Lead Initiation	First contact & capturing the lead	hsl(212, 78%, 58%)	\N	1	t	f	2026-03-31 11:31:45.86386	2026-03-31 11:31:45.86386
1ed470b1-c2a8-42b4-bff9-2b570cc5962c	qualification_analysis	Qualification & Analysis	Understanding if the lead is worth pursuing	hsl(36, 88%, 52%)	\N	2	t	f	2026-03-31 11:32:41.537103	2026-03-31 11:32:41.537103
f41ce2e9-690e-4446-9b28-a3fe0057b01c	proposal_negotiation	Proposal & Negotiation	Converting interest into a deal	hsl(258, 62%, 62%)	\N	3	t	f	2026-03-31 11:33:57.431171	2026-03-31 11:33:57.431171
bd2c3618-323a-4bf5-aa87-cf4224c48185	closure	Closure	Final outcome tracking	hsl(152, 58%, 43%)	\N	4	t	f	2026-03-31 11:35:07.563096	2026-03-31 11:35:07.563096
\.


--
-- Data for Name: pipeline_statuses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pipeline_statuses (id, stage_id, name, display_name, description, color, sort_order, is_active, is_won, is_lost, created_at, updated_at) FROM stdin;
3fc91a6f-aa0a-434b-868f-f39f68162166	f41ce2e9-690e-4446-9b28-a3fe0057b01c	ongoing_negotiation	Ongoing Negotiation	\N	hsl(270, 80%, 60%)	2	t	f	f	2026-03-31 11:34:33.461548	2026-04-13 11:59:08.623
133149e5-d199-4829-ae26-7657ebdf27d6	f41ce2e9-690e-4446-9b28-a3fe0057b01c	agreement_drafting	Agreement Drafting	\N	hsl(140, 70%, 50%)	4	t	f	f	2026-04-09 14:25:23.953905	2026-04-13 11:59:27.348
0d1682a0-923b-4762-96f9-980f2f6a4d10	bd2c3618-323a-4bf5-aa87-cf4224c48185	closed_won	Closed – Won	\N	hsl(140, 70%, 50%)	1	t	t	f	2026-03-31 11:35:57.666087	2026-04-13 12:00:12.536
5c7631b4-d245-4a98-b861-e610c69e0c10	bd2c3618-323a-4bf5-aa87-cf4224c48185	closed_lost	Closed – Lost	\N	hsl(0, 85%, 60%	2	t	f	t	2026-03-31 11:36:20.942983	2026-04-13 12:00:31.613
47dbe486-784c-42d8-9667-2d1b57567b4c	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	proposal_making	Proposal Making	\N	hsl(36, 88%, 52%)	5	f	f	f	2026-04-06 13:22:07.764535	2026-04-06 13:22:30.678
ba172a44-9305-4c9b-89cd-a9db3816c294	bd2c3618-323a-4bf5-aa87-cf4224c48185	closed_postponed	Closed – Postponed	\N	hsl(50, 90%, 55%)	3	t	f	t	2026-03-31 11:36:53.406317	2026-04-13 12:00:47.351
f3694748-47fc-4a00-9ef9-bec4dc52f766	bd2c3618-323a-4bf5-aa87-cf4224c48185	closed_ghost	Closed - Ghost	\N	hsl(210, 15%, 55%)	4	t	f	t	2026-04-02 04:06:34.87338	2026-04-13 12:01:04.286
634a9864-c0ed-44ea-8651-d8288f7507a7	bd2c3618-323a-4bf5-aa87-cf4224c48185	agreement_signing	Agreement Signing	\N	#63927c	5	t	t	f	2026-04-09 14:26:13.992574	2026-04-13 12:01:25.39
b172d3ba-af51-411b-9d60-5113d266d5c8	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	new_lead_connected	New Lead Connected	\N	#00e1ff	1	t	f	f	2026-03-31 11:32:14.781021	2026-04-13 12:02:38.787
c201795b-05d2-4c80-af2c-f90a2b7b2425	04c0c4e5-ee8f-4fe8-b635-d5ababd14bd7	company_profile_sent	Company Profile Sent	\N	#32809a	2	t	f	f	2026-04-02 04:02:59.968096	2026-04-13 12:02:51.142
605c2f58-7dd4-4a77-af99-eb80f5e7405d	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	internal_discussion	Internal Discussion	\N	hsl(30, 90%, 55%)	1	t	f	f	2026-03-31 11:33:01.725119	2026-04-13 11:57:02.523
2eca1b84-280a-49da-a529-deeb563a9167	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	requirement_analysis	Requirement Analysis	\N	hsl(210, 85%, 60%)	2	t	f	f	2026-03-31 11:33:17.30051	2026-04-13 11:57:19.989
da1f2527-5e1b-4754-a3f8-3ae175e35b81	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	eligibility_check	Eligibility Check	\N	hsl(50, 90%, 55%)	3	t	f	f	2026-03-31 11:33:33.858447	2026-04-13 11:57:34.828
55c107ac-2d68-4163-95da-af005142ebeb	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	concept_note	Concept Note	\N	hsl(270, 80%, 60%)	5	t	f	f	2026-04-07 03:07:08.396281	2026-04-13 11:57:53.615
289890ec-cc47-4d81-96cf-dcf32a4b3de9	1ed470b1-c2a8-42b4-bff9-2b570cc5962c	proof_of_concept	Proof Of Concept	\N	hsl(0, 85%, 60%)	4	t	f	f	2026-04-06 12:19:20.64832	2026-04-13 11:58:07.913
0b79d066-b90a-4a9d-a52d-fb29fd39585c	f41ce2e9-690e-4446-9b28-a3fe0057b01c	proposal_making	Proposal Making	\N	hsl(190, 85%, 55%)	3	t	f	f	2026-04-06 13:22:23.05716	2026-04-13 11:58:36.602
bd727ac7-e507-428e-99d0-30a0fd602750	f41ce2e9-690e-4446-9b28-a3fe0057b01c	proposal_shared	Proposal Shared	\N	hsl(320, 75%, 60%)	1	t	f	f	2026-03-31 11:34:17.816906	2026-04-13 11:58:51.576
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (id, role_name, resource, action, allowed) FROM stdin;
b9db81d8-324b-43d3-9688-8ce26be29131	lead_owner	leads	create	t
78a929a0-73d0-46d4-95d0-5dfa5e1fa918	manager	leads	create	t
301518b2-f25f-498e-9365-b3813212084d	lead_owner	leads	read	t
b4f57166-7088-4b93-91c8-33af0f8027cf	deal_handler	leads	read	t
6498fc91-d328-498a-991e-48b5ba2a98a2	manager	leads	read	t
4d505e17-a389-4a79-bbd8-56ed515d59ec	member	leads	read	t
1915bad0-834d-490e-9955-f0a173717774	lead_owner	leads	update	t
cb421977-c02e-45ea-8594-7e6ca3768150	deal_handler	leads	update	t
2996ae03-eb4a-41c8-b6b9-f5b1206c1f17	manager	leads	update	t
63ce5600-8e64-4921-a8dc-fdf07348ea9f	member	leads	update	f
d0837ca0-2297-4977-89e9-03f914397408	lead_owner	leads	delete	f
9e24ad58-26e8-4346-9932-6ae774b084fc	deal_handler	leads	delete	f
d87c7f72-8123-4848-8d4b-3ab5cff59faa	manager	leads	delete	f
b45a2adf-2e04-48e7-a4c4-fce990b2c0f5	member	leads	delete	f
ea0a4e4e-3e36-49ee-b2f2-e67aacf9f0c9	lead_owner	leads	export	t
2608bc5e-a44e-4d5e-ae43-1e46d56db668	deal_handler	leads	export	f
e0c7a0b3-961e-416e-9b5f-579b2af20338	manager	leads	export	t
b0a64146-770a-4d9b-900d-7620e85c9ebf	member	leads	export	f
e068ba9e-439d-417d-805b-c816ec92bf7d	lead_owner	reports	read	t
1a7041c6-64c0-41b9-b33d-1c483c560b6c	manager	reports	read	t
b6500256-f4d9-463e-8441-b27aa2c589d6	member	reports	read	t
a8c5f494-3ad6-4270-8b62-c63cadb7ee75	lead_owner	settings	read	f
3fd2c425-ca03-4d24-8ac4-3e280d4c1cbb	deal_handler	settings	read	f
83aaf791-f11a-4c84-9f45-fd13d05655e9	manager	settings	read	f
78788ad8-c548-4167-b13a-a58c9405a622	member	settings	read	f
5c507c89-e35d-4ab7-9b17-b12f4b2200ea	lead_owner	settings	update	f
525a41a5-ecc4-4c3b-a776-8065a59cdbf0	deal_handler	settings	update	f
c0269a83-e2c1-40b3-adc6-6df980350caa	manager	settings	update	f
97c545a5-bc5a-4b5c-9fee-f1faa0322e79	member	settings	update	f
15aa8f0a-e56f-4bd4-809c-9acda3fe43ca	lead_owner	team	read	f
ffe7d8d7-dd09-4b10-ab15-fbe4e4ca856b	deal_handler	team	read	f
f7bf5091-f9e8-423a-85ec-5fa827bab6ff	manager	team	read	t
4d46cf99-3b96-452a-9654-48105d0982a4	member	team	read	f
4dcadc8f-93c6-46d3-b904-93ec8b060a84	lead_owner	team	create	f
7b59d34a-d4d0-4b17-963f-24d2089e723e	deal_handler	team	create	f
051f33a3-3348-42ff-8d18-14b96269ba1a	manager	team	create	f
0d1b08d4-8c77-4eba-95b2-0bdedc3be6a7	member	team	create	f
b324d7f7-fb6b-44b4-a65b-0c7ad3e7abcb	lead_owner	audit	read	f
384ab178-d436-4c7f-8698-96dafb1c3bf5	deal_handler	audit	read	f
e6375f4a-f593-47f3-955f-dd340b1d87c7	manager	audit	read	f
6871159d-7482-4b43-a00c-131dcb6ebb57	member	audit	read	f
f94da06b-c1ff-4c58-a887-50eaedef864e	lead_owner	companies	read	t
4a3cbe58-e303-4588-a089-c7dabe2d4c67	deal_handler	companies	read	t
63433aed-2b4b-44a8-9c0c-d5e289e47be1	manager	companies	read	t
b2283595-8eca-4514-a524-602186d3616b	member	companies	read	t
b4203b70-cb10-4a9b-b3af-9a0b2b6e1fdc	lead_owner	companies	create	f
c30e881b-0b17-49d3-8ecf-86da500e78db	deal_handler	companies	create	f
9c2f91c5-5b05-4a6a-bf3f-ed0502094b5f	manager	companies	create	t
e4b4b712-c150-44f1-8b66-ae873825d799	member	companies	create	f
6a3f744d-5693-487b-afe3-94dd2082c87d	lead_owner	companies	update	f
aa7cc895-29d2-4913-b0a5-5aaec66e97f0	deal_handler	companies	update	f
b7981dd1-6cdf-47c5-8e48-41ee31a3fffb	manager	companies	update	t
794c44fc-3919-480e-b8b7-d04f7464e7a8	member	companies	update	f
d7d1e374-dcd4-44e3-876e-0cc04391fa72	lead_owner	companies	delete	f
f5add712-4d23-434d-8560-61950aacbdfa	deal_handler	companies	delete	f
91888bc7-b39d-41c6-b4d1-dc1e9ffc60f6	manager	companies	delete	f
6e2ac5ad-404e-41f3-94a5-749d4242209e	member	companies	delete	f
d8cf21ad-0e4a-4b7b-a715-21ed694cfc04	lead_owner	services	read	t
67d75ddb-e2dc-4482-91df-2d38a6c2770d	deal_handler	services	read	t
76279786-2e25-4a16-bfd7-62bfd87760fd	manager	services	read	t
5d288345-b514-4551-88e9-6f874e01fde7	member	services	read	t
33b0d358-b47e-497a-897a-0294822b682c	manager	services	create	t
d6141600-62a7-4ad5-ac26-29e55fe4ecda	member	services	create	f
82e58a74-66d9-42fe-b547-663b403eac25	lead_owner	services	update	f
b6f85e5e-9bb1-4e9c-8698-90ca2c3ae9c9	deal_handler	services	update	f
488daf23-e279-4618-a9e9-c5d389a90193	manager	services	update	t
4316f36e-8aba-4d9f-b712-dcdd94d3d2c8	member	services	update	f
13b13e63-9f47-46b0-b95a-564041ef6ab6	lead_owner	services	delete	f
e3a0f7b2-01cd-48c3-9880-dc3a72e01cf4	deal_handler	services	delete	f
a659fad7-8d57-49b1-8b64-af5967ae8139	manager	services	delete	f
8a9a03d2-4cc8-48af-8ab4-5fc1b8161ba5	member	services	delete	f
ece7db84-70b8-4bc7-9b95-934258efab01	member	leads	create	t
bfa6eeee-69b8-4a96-864f-b9fd69610277	deal_handler	leads	create	t
ff0466e0-4387-46a4-b8de-fd08a29ca04c	deal_handler	services	create	t
752ff5a4-dfcf-4ea7-9fc7-deab4ba4d848	lead_owner	services	create	t
44a9596f-16a1-4011-a6b4-2023d13e194c	deal_handler	reports	read	t
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.services (id, name, category, description, created_by, created_at) FROM stdin;
3256c3f9-7400-4ae1-932b-2037578fb2d3	Telecom Managed Services	Telecom	Manpower Services for Telecom Planning, Designing, Implementation & Optimization	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:17:53.20627
32006777-870b-4ae9-bf95-ce0200680f41	10 MBPS (Internet Lease Line)	ISP	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:30:04.686067
1f5ae568-9cbc-4a18-a26c-de4a25dcb4fb	AI Bot	AI Software	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 05:06:33.836946
d38915dc-ecf3-45f6-ad3e-874212c27666	Under 1 MW - Open Access - Captive	Solar Park		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-02 05:34:41.201404
5b24f209-9cb7-47d5-81db-7334f3baf202	Under 1 MW - Open Access - Group Captive	Solar Park	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 05:51:28.300055
a312c7c3-ba45-4dd1-9ad2-2e712f53dc5f	Under 1 MW - Open Access - Either	Solar Park	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 05:51:49.512905
29cc66aa-92e8-408a-9da3-84bdaacf9b73	Under 1 MW - Rooftop - Captive	Solar Rooftop		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-02 05:35:02.135979
b6b20be1-7162-49d3-bb9a-e32a5770649c	Software Application	Software Development	Developing Applications on Web and Mobile interfaces	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-03-30 07:50:48.39801
0f0dceed-e5ef-46cb-8a41-7af1efc8a37b	Under 1 MW - Rooftop - Group Captive	Solar Rooftop	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 06:00:01.662782
e6e731ee-4067-4e3b-9c7b-99ce75838b48	Under 1 MW - Rooftop - Either	Solar Rooftop	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 06:02:14.594491
929946e3-0d1d-40c5-bd04-50d1606cdf35	100 MBPS (Broadband + Voice)	Internet Service		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:20:12.089532
3d1bb659-6117-4b0a-8232-8b207eb44549	100 MBPS (Broadband)	Internet service 		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-01 18:23:18.58594
bb672b1f-e08a-4019-a9b0-57f3043ed8f5	Under 1 MW - Rooftop - PPA	Solar Rooftop		2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:05:11.510803
fb7e6310-2add-4e55-b81e-37515fe2bd76	Website Development	Software	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-02 07:53:50.8608
5c8f7291-6e99-4bd8-9078-565f9d8f4ef6	Acquisition	Survey	\N	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-02 12:32:44.373614
91430904-7333-4c05-b42b-d693623a49ff	CCTV Installation	Hardware	\N	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:30:19.066499
87465171-dbc1-46ed-9329-82b0b0240f4d	ISP Internet	\N	\N	d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:38:10.728836
78b74673-3266-4aaa-b18e-338e9393670d	EV Charging (Commercial)	EV Chargin Station		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:31:04.38839
995e2778-542e-48b6-8c92-16284e2acfe4	EV Charging (Society)	EV Charging Station		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-04 11:37:45.418623
89633f3e-41e4-4eb8-be19-7b3181c14410	Simulator	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-06 12:46:16.25506
3489edbd-d7a0-4368-80c0-e25dff9fcad1	Cell On Drone	Drone Manufacturing		d8aed9b8-1b13-4206-9982-653bd01d0623	2026-04-04 07:29:40.489723
c67f6bdc-6165-45db-8544-139d1a58ae20	Fire Fighting Drone	Drone Manufacturing	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-06 13:18:01.60469
55c06a94-92ef-4a34-bb3a-4c9f50bb2d6e	Fund Raising	Investment	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-07 02:59:04.346304
a36fb9df-3b66-44aa-ac2f-568047295bd8	Animation Videos	Animation		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-06 12:16:03.263087
ec801b35-b819-4c27-ab57-33afc0f80f15	Inspection Tool	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-07 03:05:33.711146
942853e6-2ed2-4011-b09c-920cfb0f98d5	1 GBPS (Lease Line)	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-07 03:23:44.643667
0994d346-efea-47e6-ac4a-ca500ebd8c5f	Underground Fibre Laying	Fibre	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-07 03:26:59.096263
2386840a-fa2b-4da0-b7de-762506fce0b7	Over Head Fibre	Fibre	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-07 03:27:17.256291
f07c9449-4526-43d2-aec8-72c53f203dcc	EV Charging 2 Wheeler (Society)	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-09 09:35:06.483303
2ba70d69-2120-4fe2-b30a-c093ebe13f68	EV Charger for 2 & 4 Wheeler (Society)	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-09 14:22:10.950235
06ee0b9c-a578-4e50-a717-56470e283899	EV Charger for 2 & 4 Wheeler (Commercial)	\N	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-09 14:22:27.642196
8ce99a39-f4a5-4148-92d9-ddd5e9f61c9b	Telecom Towers	Telecom	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-10 14:28:38.915363
842e6e02-1157-44b5-8857-e195f516808a	Above 1 MW - Open Access - PPA	Solar Park		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-10 15:47:24.482161
8ff09bef-9f05-4577-9e8c-f92d6e883313	Above 1 MW - Open Access - EPC	Solar Park	\N	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-10 15:53:02.977024
4507f475-1f14-4f9b-b9ba-196dc8bd57fb	Defence Drone	Drone Manufacturing		6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-13 04:06:07.568994
759f4732-33bf-4e51-88ca-991ec52f4c15	Hardware Purchase	\N	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-15 15:40:48.121288
9425ef07-2954-4826-b0f5-fdf28143a86d	BESS	\N	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-16 15:40:29.632147
c046ed7f-90c1-485b-8217-df682260b199	OneTracker	\N	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-16 16:01:33.386767
aa93e14e-1009-4045-8ba5-6be63bea2035	Solar Connectivity Validation	Solar Park	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-17 16:13:57.380238
8a0c26db-1193-4f53-9568-e295dd6890ec	HDD Work	\N	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-17 16:48:38.194804
44180603-9ea9-48ca-9d20-b4c5022884bc	Website Support	\N	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-17 17:03:24.080114
6dbce491-e66f-4cf4-a3ce-bfbf287a750e	Monthly Support	software	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-17 17:06:10.720267
89dc799c-08b0-41a6-b9c8-5ea9d2f3ce50	Mobile Application Development - Flutter	\N	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-17 17:14:28.370022
8ce1718d-db24-4acc-a9df-f530ff491c70	RTC Green Power for Telecom Industry	Telecom	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-17 17:35:24.743427
0105c096-8300-48db-8e1c-ff00e7b89162	Shopify Website	\N	\N	f08ee1d2-e4e2-4130-8637-b1d04706af56	2026-04-17 17:46:10.376731
aef2244f-3332-4ccb-b1ba-e4ead56633c2	Residential Solar	\N	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-18 14:36:37.84256
c2528208-bbe0-4612-8ab2-2304f1efe2ea	Lead Management System - SAAS	SAAS Model	\N	945ae736-dbf9-49cc-86bd-34dd74f5a84b	2026-04-21 05:25:22.526099
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_roles (id, user_id, role) FROM stdin;
ae167936-1814-40a6-98c2-f4f4251eaa8c	6f65730a-b2a4-475c-9ffe-45f4f7347b97	admin
7fa3666d-48e2-4eb7-90ff-35fd90f8244c	6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	admin
d25b334d-ec8c-4851-a60e-8e5a0a8f27d2	2db3bd18-6b0f-4992-b783-47a05c8f630c	admin
52141987-3325-4cb5-a235-f08910849b0c	d8aed9b8-1b13-4206-9982-653bd01d0623	admin
6039034b-a4d6-4a81-9a3b-666f5f520d9d	2ee5a850-f5e2-491e-9acf-799d9774cd21	admin
66429126-1d40-4454-8ce3-5cb0ec0bd2ed	f08ee1d2-e4e2-4130-8637-b1d04706af56	admin
fb577ffe-2ac5-4640-b962-fc2da66a5b62	8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	admin
8738b5d7-16c1-464e-9245-b00f1d0f5660	3d325efb-4805-4230-ac98-d25543769e2b	admin
97bc2d2d-cc6f-451d-8b02-4df197655e1f	dfdbbede-0a61-4ff5-855b-58f2e05c5dda	admin
06ca4b4c-7833-4c00-b1ed-f6aefdd0897e	d2218768-ed36-496d-86fa-34ae48a66111	admin
982f2618-2a79-470e-be44-8ece8c813387	8a0aa7ae-6fa3-4b61-af77-f3132beb1515	admin
143ca21c-903b-458b-92c7-4ab1afebf855	945ae736-dbf9-49cc-86bd-34dd74f5a84b	admin
712f2cf9-fede-4b02-8824-8fdbbf924bee	18282add-4e7f-411f-bc7c-34d5ef6bef19	admin
8d5fc084-4b6f-4f81-af4f-d9b6508635e4	e48cf338-0e13-40af-a9fb-9d54797b85c4	admin
50230fa3-11d1-4fc8-baab-32daf72b2f20	ff6fb865-f4ae-4a00-865d-a9515317e382	manager
c336e888-165f-46bb-b661-b66ea3fbd7ac	916e4c26-2f9f-471a-8f68-9e4a287f4169	manager
d3f6740f-ad23-4f2d-9e37-ddf84dcaec64	7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	manager
9732db88-5d35-467a-ac3a-8dbce54ce6b5	9f0afd4f-fea4-4740-bec1-8e39d33a988b	manager
fd056b79-bb33-4154-aee1-76fd79019be3	8000364a-2928-4781-8b70-4061b25b53ff	manager
443e07cb-33dd-4bbf-914b-1a7bad4b8b1d	f25282e4-45e4-4704-bac9-01214042a80b	manager
86b0eb0e-a9b9-4133-8394-7fac07e00274	2fe65a52-f4c3-416b-b999-426704e830fd	manager
caa8e3c7-7475-43e0-b3c2-5fd0f673d42b	1915618a-38c5-4473-bef8-765a5555d3f1	manager
1297a038-29a6-4598-ba7a-c213c73ad75f	7ea66e43-0d18-429b-8946-63c75984a568	manager
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password_hash, display_name, avatar_url, created_at, updated_at) FROM stdin;
6714ff88-0b09-47ef-9bbc-c59ea2d6f5c9	siddharth.karanjekar@onerooftech.com	$2b$12$Te/R4cUSK7Si5BVuL3D5X.GnUIJTiaRnv1UKPKVfmY0bsgPiWkXnS	siddharth.karanjekar	\N	2026-03-30 10:15:56.576694	2026-03-30 10:15:56.576694
2db3bd18-6b0f-4992-b783-47a05c8f630c	sidhuajay955@gmail.com	$2b$12$kax4MFOzyTn5nAE3Fd.8v.MKfAxjP/CZR7QPjLPYz4nN5BJVO8Mg2	sidhuajay955	\N	2026-03-30 10:23:02.110788	2026-03-30 10:23:52.7
e48cf338-0e13-40af-a9fb-9d54797b85c4	siddharthajay955@gmail.com	$2b$12$T.Q3P8h2xK1Dx5VxgSTAAeD/SjaD0UkJZviX7KPzxXkWueO63zPP2	siddharthajay955	\N	2026-03-30 10:26:26.814261	2026-03-30 10:26:26.814261
d8aed9b8-1b13-4206-9982-653bd01d0623	chirag@onerooftech.com	$2b$12$rtmYXyhCN4FucDAOXBknGOEFCORYoKOpivLSNgK23y6wRHfftSnFa	chirag	\N	2026-04-01 14:32:14.283305	2026-04-01 17:21:51.856
2fe65a52-f4c3-416b-b999-426704e830fd	shashwat.hegde@onerooftech.com	$2b$12$1Wt4b3F5tzEXcbqjLlTKX.ahbU5WF2xZ8zMaLYO2tM9WrI06dYnTa	shashwat.hegde	\N	2026-04-02 04:33:38.024487	2026-04-02 04:36:41.812
7ff03efd-ac51-4c86-ad54-c6f2b0a47ff7	brijesh@naturenergy.in	$2b$12$O.IN6OoWZZHJfxig0HQwwuazg1rFO3gIa/4LzwvdEjlTam0Aq36qa	brijesh	\N	2026-04-02 05:47:17.851857	2026-04-02 05:47:17.851857
2ee5a850-f5e2-491e-9acf-799d9774cd21	zeel.karatela@onerooftech.com	$2b$12$cjg5tlCOteg7fVE82PWuxea9RLiaY8ep4XKHBC4ulSi0MUNrEH7lu	zeel.karatela	\N	2026-04-02 04:36:41.037251	2026-04-02 06:46:39.38
18282add-4e7f-411f-bc7c-34d5ef6bef19	sandeep@purplesoil.om	$2b$12$IqOTfsgMwKjpLM7KUkVS1.PQ9DjSbm5TTZJJBFntiN85D6BiNF7D6	sandeep	\N	2026-04-02 07:10:24.196391	2026-04-02 07:10:24.196391
ff6fb865-f4ae-4a00-865d-a9515317e382	meghraj@hyworth.in	$2b$12$v7PcFaOdt2JlG8QVutjff.IWo7x9.0QAqplbwgnVsKuEmFU4wSIwS	meghraj	\N	2026-04-02 07:10:58.593392	2026-04-02 07:10:58.593392
3d325efb-4805-4230-ac98-d25543769e2b	sanjeev@purplesoil.com	$2b$12$uTtupau73tw9a8mZDtHzMe5V6jTLzIhCgpzvZ1K9avDezaKLTat2e	sanjeev	\N	2026-04-02 07:11:39.158865	2026-04-02 07:11:39.158865
f08ee1d2-e4e2-4130-8637-b1d04706af56	kenil@onerooftech.com	$2b$12$qu1cf4C3BLdMGzKwXVLe4OWKMbKU0dEvuWQt9ukcK/jmGmqKfO5Nu	kenil	\N	2026-04-02 07:07:43.472671	2026-04-02 07:16:57.29
8a8f5bd7-54f3-41c5-b3d8-5e2094cfcdd9	siddharth@onerooftech.com	$2b$12$YfGzcjhZ3Arym8gHKl42vOvIdbpC.HdALrwAPXDlGI9oXIec0C1vi	siddharth	\N	2026-04-02 07:08:54.419149	2026-04-02 07:28:36.183
dfdbbede-0a61-4ff5-855b-58f2e05c5dda	sohil@onerooftech.com	$2b$12$hEWkhRAE5LIx6OMsazjuXu8LsnQfWo317S0a8t5xxH2ar2fslaPDa	sohil	\N	2026-04-03 05:32:33.099012	2026-04-03 05:32:33.099012
8a0aa7ae-6fa3-4b61-af77-f3132beb1515	prithvi.thakker@onerooftech.com	$2b$12$Rthai9t2dargIboO8/IabOudspZIFpOrvdhKE.FfL2IbkPuh1MQva	prithvi.thakker	\N	2026-04-03 05:33:58.69386	2026-04-03 05:33:58.69386
d2218768-ed36-496d-86fa-34ae48a66111	yash.galiya@onerooftech.com	$2b$12$7JCVgIcXN5EokL8886Uk4Ogs8Rz7NpWvTuq8VWKRYSYGHNp4DZMcK	yash.galiya	\N	2026-04-03 05:34:36.579948	2026-04-03 05:34:36.579948
1915618a-38c5-4473-bef8-765a5555d3f1	shashikant@onerooftech.com	$2b$12$XNa4nPXlpJ11YnZTmppDsuHXBWRrau9kNhkgiX6.OVVXRmfL5AOCm	shashikant	\N	2026-04-03 05:36:01.937717	2026-04-03 05:36:01.937717
9f0afd4f-fea4-4740-bec1-8e39d33a988b	gagan.kamble@irajtechlabs.com	$2b$12$pYXYHUiXhHACiQgGcBc1y.Ry8JtTSwVynuo1w1/TBywLGc63N9en2	gagan.kamble	\N	2026-04-03 05:37:52.076433	2026-04-03 05:37:52.076433
7ea66e43-0d18-429b-8946-63c75984a568	yash.lokhande@irajtechlabs.com	$2b$12$CPyvEBn44c2RNDgPWKn/MObvNlE6FBYDZ1kKMcr6pRUiFYFasPbjG	yash.lokhande	\N	2026-04-03 05:38:45.975953	2026-04-03 05:38:45.975953
f25282e4-45e4-4704-bac9-01214042a80b	sanket@infraconn.com	$2b$12$q2xDfE8PywP8fphwVR3YkupzaQQ5B.C1Xqgi3zDeKPSC2KYwX.olG	sanket	\N	2026-04-03 05:39:33.178995	2026-04-03 05:39:33.178995
8000364a-2928-4781-8b70-4061b25b53ff	kaushik@purplesoil.com	$2b$12$UMktUHe3jQpT51/hnizMLeOfFRLzSDVXkVkB7uSqz9wA2MlimHwZC	kaushik	\N	2026-04-03 05:42:24.590137	2026-04-03 05:42:24.590137
916e4c26-2f9f-471a-8f68-9e4a287f4169	ajay@hyworth.in	$2b$12$9cgQKXdbHAKxAhJe5mZ8feWb/HNIMEnWXXzyK89mDmyCNMtvlQ78i	ajay	\N	2026-04-10 14:27:48.645726	2026-04-10 14:27:48.645726
6f65730a-b2a4-475c-9ffe-45f4f7347b97	admin@sparkleadhub.com	$2b$12$6891KzBvbun1UYAj.C4cVuYs5oXGC5/4v/hCrmPXTw2MRfBt6KONS	Admin	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABgAGADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAUGBwgEAv/EADUQAAEDBAADBAgEBwAAAAAAAAEAAgMEBQYRBxIhEzFBYQgUFRYiUXGBI2ST4SQ4UnShs/H/xAAXAQEBAQEAAAAAAAAAAAAAAAAABAID/8QAIxEBAAICAQEJAAAAAAAAAAAAAAECAxHBBBITI1FhcYGhsf/aAAwDAQACEQMRAD8A58REQEREBERAREQEREBERAREQEREBERAREQEREBERARFuHBjGbNbMEvfEHJqKO4RURdFR0krdsc5oG3EHoducB5aJQYfsfNFuFi463G632GhzG22uuxuplbHJS+rDUDSdBzd73y9Do/LwPVVXjxhVNhGcvpLbzC3VcIqqdhJPICSC3fjotP20gzlNhdMWQYravR0x29ZLao64wyyuigYwNdUy9tKGMe/Ww3xJPgO49AYzH+OdPcrTe7TkdFbrXbH0D46KGjp3FvaHoG6GwBon5DogxLEbFPk+SUFmpJI4p6yTs2Pk3yg6J66+i+80x6oxPJ6+x1ksc1RRua17498p20O6b8nLTuAOaimyLHMb93rHKXVD2+0n026scxe/fP5b5R5BT3F3ic2x8Rr1bfc/Fq/1d7G+s1lF2ksm42nbnb69+voAg54RS2UXn2/e6i4igorf22v4aij7OJmgB8LfDu2olAREQF0Rw/a7J/Rov8AY7Y0y3K3zPe6BnV7mlwkBA8/iA+fKVzup7DMtvGHXcXGw1Rgn5eR7SOZkjf6XN8Qg82LWirv2RW+2W6F0tVUzNY1rR3derj8gB1J8AFrnpaXOGqzq3UEDmvdQ0QbIQeoe5xOj9g0/deCfj9kXZSvoLZZqKvnGpqyKn/Ef07z5/XayW4VtTca6etr55KiqneZJZZDtz3HvJQblk/8qGLf3j/90ywVWitzi71mDUWJTGn9k0chli1HqTZc53V2+vVx8FV0F34JSsh4r40+Vwa31oDZPiWkD/JCkPSHhlh4w5CZY3MEjonsLhrmb2TBseWwR9lntNPLS1MNRTyOjnhe2SN7TotcDsEeYIBWut493ypo44b7ZrJd3xj4JKmmBIOu/Xdv6aQY6m1Yclyyuv8AlJvtRDSw1XwBscMfLG0MAAAH0C9Xv5efyv6X7rtipitHiWmPjfMJc+TqKTHc0i0ettcSqm0Vr9/Lz+V/S/dRF9vdXe5IX1vZ7iBDeRuu/wD4tZKYYrul5mfbXMsYcvVWvEZccRHnFt/XZj9RaIinWiIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIg//2Q==	2026-03-30 07:21:57.917854	2026-04-13 06:58:07.292
945ae736-dbf9-49cc-86bd-34dd74f5a84b	smit@onerooftech.com	$2b$12$L35gwn.C0mKgls65zIG9NO9iyePbUDBuZDAgPPBbuffFNH2xkWwbC	Smit Lalai	\N	2026-04-02 04:53:51.269908	2026-04-13 15:54:00.133
\.


--
-- Data for Name: whitelisted_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.whitelisted_users (id, email, status, assigned_role, invited_by, created_at, updated_at) FROM stdin;
953afd76-d7ec-4194-872d-5a6de977de3a	admin@sparkleadhub.com	active	admin	\N	2026-03-30 07:21:57.881173	2026-03-30 07:21:57.881173
64c3fce1-0e7d-4596-ade6-249e3211b1ae	siddharth.karanjekar@onerooftech.com	active	admin	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-03-30 10:15:56.095868	2026-03-30 10:15:56.095868
9163c6f6-9ce3-49d1-8c28-98970dc261cb	sidhuajay955@gmail.com	active	admin	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-03-30 10:23:01.665367	2026-03-30 10:23:01.665367
1925e288-090f-4f2e-a2de-0c265e044efb	chirag@onerooftech.com	active	admin	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-01 14:32:13.809764	2026-04-01 14:32:13.809764
32b80d0a-793d-476d-bd03-dc9e05274ae4	zeel.karatela@onerooftech.com	active	admin	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:36:40.507215	2026-04-02 06:50:24.692
122cf260-e873-4b73-8de7-5cbca78b5800	kenil@onerooftech.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:07:42.990174	2026-04-02 07:07:42.990174
f9f01365-1315-400e-81cb-888e73ce5f59	siddharth@onerooftech.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:08:53.943979	2026-04-02 07:08:53.943979
b334e21d-7f00-4b94-a892-9846051494ea	sanjeev@purplesoil.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:11:38.648324	2026-04-02 07:11:38.648324
d67815e4-233a-4b93-b8d2-deebc650b983	sohil@onerooftech.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:32:32.627273	2026-04-03 05:32:32.627273
3eff7d49-d1e1-462b-9e76-7c885749491c	yash.galiya@onerooftech.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:34:36.142225	2026-04-03 05:34:36.142225
6408b4ae-8301-4c32-b50f-4645b428b5ce	prithvi.thakker@onerooftech.com	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:33:58.250036	2026-04-06 13:36:31.725
d3053528-c1c8-418a-94da-4feea821ee86	smit@onerooftech.com	active	admin	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:53:50.80149	2026-04-13 15:53:49.197
b1bb6d1b-aed2-4075-83d2-c934b2e93c45	sandeep@purplesoil.om	active	admin	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:10:23.732161	2026-04-13 18:04:09.999
ede7ea5d-2b49-4e3e-91a1-748f4aa1e885	siddharthajay955@gmail.com	active	admin	2db3bd18-6b0f-4992-b783-47a05c8f630c	2026-03-30 10:26:26.351945	2026-04-13 18:04:25.528
2e5b60ea-761f-4062-a352-981710a86ba1	meghraj@hyworth.in	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-02 07:10:58.079387	2026-04-13 18:38:43.263
0b597c1e-45a8-4c68-b28c-623a849199e9	ajay@hyworth.in	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-10 14:27:48.101588	2026-04-17 17:01:16.544
e7322f88-441e-44d8-b3ab-5e521e3e7b76	brijesh@naturenergy.in	active	manager	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 05:47:17.359797	2026-04-17 17:01:18.308
e0cf0c80-2c54-41bf-8d50-edc9ec9c8e7b	gagan.kamble@irajtechlabs.com	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:37:51.638267	2026-04-17 17:01:23.168
7e56408e-314e-4f82-842a-c7d20b39560e	kaushik@purplesoil.com	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:42:24.119594	2026-04-17 17:01:26.095
42bded2a-0be7-436e-82e0-652dbb2af37d	sanket@infraconn.com	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:39:32.727021	2026-04-17 17:01:35.472
8f28981f-5c57-4cad-9ad8-a40ce83057cf	shashwat.hegde@onerooftech.com	active	manager	6f65730a-b2a4-475c-9ffe-45f4f7347b97	2026-04-02 04:33:37.54136	2026-04-17 17:01:41.307
71d3a88e-bf5d-4496-9073-82207176efcf	shashikant@onerooftech.com	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:36:01.506501	2026-04-17 17:01:42.839
e34bb2a6-0084-4c43-8956-47fd314de89d	yash.lokhande@irajtechlabs.com	active	manager	2ee5a850-f5e2-491e-9acf-799d9774cd21	2026-04-03 05:38:45.542241	2026-04-17 17:01:58.12
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 6, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: access_requests access_requests_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_email_unique UNIQUE (email);


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_services company_services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_companies lead_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_pkey PRIMARY KEY (id);


--
-- Name: lead_documents lead_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: lead_value_history lead_value_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_value_history
    ADD CONSTRAINT lead_value_history_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: pipeline_stages pipeline_stages_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_name_unique UNIQUE (name);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: pipeline_statuses pipeline_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whitelisted_users whitelisted_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_email_unique UNIQUE (email);


--
-- Name: whitelisted_users whitelisted_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: access_requests access_requests_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: audit_log audit_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: companies companies_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: company_services company_services_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_services company_services_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lead_companies lead_companies_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: lead_companies lead_companies_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_documents lead_documents_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_documents lead_documents_note_id_lead_notes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_note_id_lead_notes_id_fk FOREIGN KEY (note_id) REFERENCES public.lead_notes(id) ON DELETE SET NULL;


--
-- Name: lead_documents lead_documents_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: lead_notes lead_notes_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lead_value_history lead_value_history_changed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_value_history
    ADD CONSTRAINT lead_value_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: lead_value_history lead_value_history_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_value_history
    ADD CONSTRAINT lead_value_history_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: leads leads_pipeline_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pipeline_stage_id_pipeline_stages_id_fk FOREIGN KEY (pipeline_stage_id) REFERENCES public.pipeline_stages(id);


--
-- Name: leads leads_pipeline_status_id_pipeline_statuses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pipeline_status_id_pipeline_statuses_id_fk FOREIGN KEY (pipeline_status_id) REFERENCES public.pipeline_statuses(id);


--
-- Name: leads leads_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pipeline_statuses pipeline_statuses_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_stage_id_pipeline_stages_id_fk FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id) ON DELETE CASCADE;


--
-- Name: services services_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: whitelisted_users whitelisted_users_invited_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict xglCeVbBQQZENZdQoFSX8BsAVWUE3UyxU9hnajYswi85MN8XVfo0L9N3waTy81n


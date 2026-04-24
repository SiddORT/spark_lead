--
-- PostgreSQL database dump
--

\restrict GWQh7LHfBv8qn0IyPsoyHuHKvpe6svoFzT91sgPYRZJdUUd8pBrho8aRAlm9H9h

-- Dumped from database version 16.10
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
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'member',
    'lead_owner',
    'deal_handler'
);


ALTER TYPE public.app_role OWNER TO postgres;

--
-- Name: decision_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.decision_role AS ENUM (
    'champion',
    'gatekeeper',
    'economic_buyer'
);


ALTER TYPE public.decision_role OWNER TO postgres;

--
-- Name: emotional_state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.emotional_state AS ENUM (
    'skeptical',
    'enthusiastic',
    'frustrated'
);


ALTER TYPE public.emotional_state OWNER TO postgres;

--
-- Name: friction_point; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.friction_point AS ENUM (
    'scaling',
    'tech_debt',
    'budget'
);


ALTER TYPE public.friction_point OWNER TO postgres;

--
-- Name: kill_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.kill_reason AS ENUM (
    'feature_gap',
    'price',
    'ghosted'
);


ALTER TYPE public.kill_reason OWNER TO postgres;

--
-- Name: lead_outcome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_outcome AS ENUM (
    'closed',
    'lost',
    'wip',
    'delayed'
);


ALTER TYPE public.lead_outcome OWNER TO postgres;

--
-- Name: lead_stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_stage AS ENUM (
    'discovery',
    'qualification',
    'strategy',
    'resolution'
);


ALTER TYPE public.lead_stage OWNER TO postgres;

--
-- Name: lead_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_type AS ENUM (
    'hot',
    'warm',
    'cold',
    'ghosted'
);


ALTER TYPE public.lead_type OWNER TO postgres;

--
-- Name: strategic_tier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.strategic_tier AS ENUM (
    'high',
    'med',
    'low'
);


ALTER TYPE public.strategic_tier OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.access_requests OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    industry text,
    notes text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    service_id uuid NOT NULL
);


ALTER TABLE public.company_services OWNER TO postgres;

--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.lead_activities OWNER TO postgres;

--
-- Name: lead_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    company_id uuid NOT NULL
);


ALTER TABLE public.lead_companies OWNER TO postgres;

--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.lead_notes OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
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
    lead_kill_reason text
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.pipeline_stages OWNER TO postgres;

--
-- Name: pipeline_statuses; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.pipeline_statuses OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_name public.app_role NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    allowed boolean DEFAULT true NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'member'::public.app_role NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: whitelisted_users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.whitelisted_users OWNER TO postgres;

--
-- Data for Name: access_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_requests (id, name, email, department, reason, status, reviewed_by, reviewed_at, created_at) FROM stdin;
7bb37f2b-ab16-45db-98d1-e55145cdbf38	Test Approve User	testapprove789@example.com	Sales	Test	pending	\N	\N	2026-03-30 09:02:55.644136
66cc7aff-2c6d-4571-991e-eff3c87fcc8d	Jane Doe	janedoe_test999@example.com	Sales	Need access	pending	\N	\N	2026-03-30 09:03:04.524516
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, user_id, action, resource, resource_id, details, created_at) FROM stdin;
d339bf95-7081-4ae3-8edf-38711fba187e	310846dc-de7c-4f2b-b9c0-114caa198d7a	lead.created	leads	77359f4d-426d-4d11-899f-938eea5bc7bc	{"company": "TechNova Solutions", "leadName": "Rajesh Kumar"}	2026-03-27 18:40:35.571656
64c06534-248e-41cd-8c00-157f78fe2f69	310846dc-de7c-4f2b-b9c0-114caa198d7a	lead.created	leads	bb183adb-556a-4dd5-bbd6-b7096a7e9af8	{"company": "GlobalBridge Consulting", "leadName": "Priya Sharma"}	2026-03-27 18:40:35.571656
855c6fc7-985a-4672-b9d9-f3d1211d907c	310846dc-de7c-4f2b-b9c0-114caa198d7a	lead.closed	leads	f520140c-4f02-407b-863e-dbbca2d143c0	{"outcome": "closed", "leadName": "Sunita Reddy", "dealValue": "750000"}	2026-03-27 18:40:35.571656
f774fbb1-92bc-49e2-8f39-300a060023ea	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	db1929d3-e646-49b1-a47d-999013c5cf92	{"role": "admin", "email": "siddharth.karanjekar@onerooftech.com"}	2026-03-30 05:36:54.74649
8b7911bd-58a5-4e95-8e77-8a8d402927e7	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_disabled	team	db1929d3-e646-49b1-a47d-999013c5cf92	{"email": "siddharth.karanjekar@onerooftech.com", "status": "disabled"}	2026-03-30 06:43:03.208858
ee6f2323-1a21-43b1-94ae-28039335bd51	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_enabled	team	db1929d3-e646-49b1-a47d-999013c5cf92	{"email": "siddharth.karanjekar@onerooftech.com", "status": "active"}	2026-03-30 06:43:04.516388
496443a1-4493-4c68-9cfd-712aacbbf160	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_deleted	team	db1929d3-e646-49b1-a47d-999013c5cf92	{"email": "siddharth.karanjekar@onerooftech.com", "displayName": "siddharth.karanjekar"}	2026-03-30 07:09:07.764151
49fe38a9-9841-455f-ad70-eb367c43af57	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	b107dad1-b89d-4b17-b9f5-47130cbc9cdf	{"role": "admin", "email": "siddharth.karanjekar@onerooftech.com", "emailSent": false}	2026-03-30 07:09:30.26386
0f827bf0-b695-4d02-abfd-f1ad3d1e1271	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	42b93c00-3887-4b67-afe8-44e7893bfee3	{"role": "deal_handler", "email": "testinviteuser123@example.com", "emailSent": false}	2026-03-30 09:02:34.049472
0c070130-90b4-423b-9dfd-bd741b5121bd	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	cfdb875a-2726-4e37-a5ce-563af3e9cd21	{"role": "deal_handler", "email": "testinviteuser456@example.com", "emailSent": false}	2026-03-30 09:02:41.695669
914d1d1b-9c83-4d9a-be84-3f8c599b223d	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_deleted	team	b107dad1-b89d-4b17-b9f5-47130cbc9cdf	{"email": "siddharth.karanjekar@onerooftech.com", "displayName": "siddharth.karanjekar"}	2026-03-30 09:37:45.421601
69dcd332-d780-4ef5-802c-047d177000fe	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	eb3048c5-65b9-4f37-9560-bc9e5002b8cb	{"role": "admin", "email": "sidhuajay955@gmail.com", "emailSent": false}	2026-03-30 09:38:13.670415
4897b1cc-d11f-4cd9-b853-65c7f1248b7f	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	7fc3cce7-60a8-4c7b-ab2f-aaa2c9d4d2cf	{"role": "deal_handler", "email": "sparkleadhub@gmail.com", "emailSent": true}	2026-03-30 10:07:34.127034
4cc5d916-8b11-44cd-aaa2-2c4bb5112bde	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"role": "deal_handler", "email": "newuser+e2e@example.com", "emailSent": true}	2026-03-30 10:56:20.267824
33a602b2-53c4-460a-8438-23321187cb09	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	643a3225-eb7c-46c3-8ffa-5f3be6de8015	{"role": "admin", "email": "viswajeet.bharti@onerooftech.com", "emailSent": true}	2026-03-31 06:55:11.9598
7af5a50e-7a48-4167-8ec7-33cc93437e1d	310846dc-de7c-4f2b-b9c0-114caa198d7a	delete	leads	b65fb4db-1389-464c-9293-768923fec4ac	{"leadName": "Vikram Singh"}	2026-03-31 10:03:47.193198
4742bb67-163c-430e-8f03-3f0132c6436b	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	531ea48a-cc87-4b06-9436-37694f3087ff	{"role": "admin", "email": "prithvi.thakker97@gmail.com", "emailSent": true}	2026-04-06 13:41:14.091621
c5481026-2244-495f-a682-6b3c6ca5ce3a	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com", "emailSent": true}	2026-04-13 13:18:08.261048
ca4c7b67-5a06-4a6d-a487-f92e3cd7af5c	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	310846dc-de7c-4f2b-b9c0-114caa198d7a	{"email": "admin@sparkleadhub.com", "emailSent": true}	2026-04-13 13:18:21.734801
91116f6c-a20d-41a3-bb25-1585718ebe40	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com", "emailSent": true}	2026-04-13 13:21:11.677887
db8e05ee-387c-4da7-8ccc-dfa28cbe4d34	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com", "emailSent": true}	2026-04-13 13:22:07.150207
df5825c3-32e5-43e4-9e1c-208b2435a3bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	user_invited	team	dca01c75-aa8c-45b3-839d-5c9f813d074b	{"role": "admin", "email": "siddharthajay955@gmail.com", "emailSent": true}	2026-04-13 13:26:18.324884
19753030-9dd7-4f10-89d1-5d49ffe1b85e	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	accf25b5-955d-4545-aa76-9132f8785c43	{"email": "superadmin@sparkleadhub.com", "emailSent": true}	2026-04-13 13:28:19.812962
32cab615-7abd-4475-905c-22bddc2dbaf4	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_generated	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com"}	2026-04-13 13:32:34.317573
ba1c0af8-3c3b-4e1d-b7fd-0f546aa5a46d	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_generated	team	accf25b5-955d-4545-aa76-9132f8785c43	{"email": "superadmin@sparkleadhub.com"}	2026-04-13 13:34:09.984552
4cd43e89-9c4e-457c-918e-07c458fec2ab	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	accf25b5-955d-4545-aa76-9132f8785c43	{"email": "superadmin@sparkleadhub.com", "emailSent": true}	2026-04-13 13:34:21.177327
f828ae15-74a2-4003-8ca0-a7f57a1a1b44	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_resent	team	accf25b5-955d-4545-aa76-9132f8785c43	{"email": "superadmin@sparkleadhub.com", "emailSent": true}	2026-04-13 13:34:48.695237
7439f69f-4ee3-4b4b-aac6-36864e3eeaf2	310846dc-de7c-4f2b-b9c0-114caa198d7a	password_link_generated	team	dca01c75-aa8c-45b3-839d-5c9f813d074b	{"email": "siddharthajay955@gmail.com"}	2026-04-13 13:52:29.477038
685a0705-8e31-4911-b977-bf1d86f44323	310846dc-de7c-4f2b-b9c0-114caa198d7a	role_change	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com", "newRole": "lead_owner"}	2026-04-13 15:26:18.926071
b95fcd2b-7fd9-42f2-834c-c23ec95eb3d6	310846dc-de7c-4f2b-b9c0-114caa198d7a	role_change	team	89418507-4295-4d0e-a5d3-eed3e9738eaf	{"email": "newuser+e2e@example.com", "newRole": "deal_handler"}	2026-04-13 15:26:37.255693
7c4ef616-f4ad-4295-baf2-1f5e588c02bf	310846dc-de7c-4f2b-b9c0-114caa198d7a	role_change	team	dca01c75-aa8c-45b3-839d-5c9f813d074b	{"email": "siddharthajay955@gmail.com", "newRole": "lead_owner"}	2026-04-13 15:50:23.518192
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, industry, notes, created_by, created_at) FROM stdin;
5530bbbd-f2d3-4e99-b285-44b847512e1e	TechNova Solutions	Technology	Enterprise software company	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.661798
b6b62a92-9112-4828-a158-2f047e7584c0	GlobalBridge Consulting	Consulting	Strategy and management consulting	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.661798
cdf5b68d-1e47-453b-bc3e-d65718f57861	FinEdge Partners	Finance	Investment and wealth management	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.661798
\.


--
-- Data for Name: company_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_services (id, company_id, service_id) FROM stdin;
5453c555-3b3d-4c40-b159-2418fe88fcb7	5530bbbd-f2d3-4e99-b285-44b847512e1e	af2e6bd0-0778-4f82-974c-cb2928c77567
e8e24bb2-558c-447b-907e-9d1d56e87786	5530bbbd-f2d3-4e99-b285-44b847512e1e	6533c5ca-c650-4f8c-a0ee-2561197d955e
218ba092-418a-4cd3-862b-69f3db359cfe	b6b62a92-9112-4828-a158-2f047e7584c0	19dcdcf9-58b6-4388-bad6-1f033c1f7ea0
4dc3a2d9-dabc-4765-bd38-036ac6efd8fd	cdf5b68d-1e47-453b-bc3e-d65718f57861	6533c5ca-c650-4f8c-a0ee-2561197d955e
0a225d81-a757-46d0-9374-6e1559577a9e	cdf5b68d-1e47-453b-bc3e-d65718f57861	03f92284-6e9a-4360-a5c4-dda04cc53545
4504de98-632a-41a8-ac2c-594e6fa4ae38	cdf5b68d-1e47-453b-bc3e-d65718f57861	fb84a0d6-0c13-42e6-bb86-1b1d6de71629
ce9ca73d-a756-47d4-9239-0c17334e93ad	b6b62a92-9112-4828-a158-2f047e7584c0	fb84a0d6-0c13-42e6-bb86-1b1d6de71629
36741dc4-cdb6-44f9-8e91-a66a7224efbb	5530bbbd-f2d3-4e99-b285-44b847512e1e	fb84a0d6-0c13-42e6-bb86-1b1d6de71629
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_activities (id, lead_id, user_id, action, field_name, old_value, new_value, note_content, created_at) FROM stdin;
a8d28448-1efa-423b-96b9-62f13f7c19eb	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	stage	qualification	strategy	\N	2026-03-27 18:53:14.480134
2b1d8195-38d6-4b5e-b2fe-cfa3109c86d5	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	customHook		testing done	\N	2026-03-27 18:53:14.480134
540b1abb-e2c9-4279-87b4-ce2ee4b96c79	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	stage	strategy	qualification	\N	2026-03-27 18:53:31.879832
00af8644-0135-4cf0-9eb2-da5723db9fc5	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-03-30 07:44:23.187442
4bdca362-3e1e-4667-98b8-824e865d6225	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000003	\N	2026-03-30 13:27:43.240998
f62ae898-0ee2-4353-8d9e-3316fbb73d9d	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	ea4071cb-2565-4386-b88d-d3a7fe8b40d1		\N	2026-03-30 13:27:43.240998
65313fad-ced0-4204-9d20-b1ee0b2c843c	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-03-30 13:27:48.433453
3e2b829c-0793-4b72-9fa9-77b29b842358	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000001	\N	2026-03-30 13:27:54.41892
40fd8554-38e3-47d9-a372-eb1a533316f0	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	6a0506fd-b1a5-492e-a86d-b5b04020287b		\N	2026-03-30 13:27:54.41892
66b42512-e8fd-4323-97d3-7b1652854ebf	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000003	\N	2026-03-30 13:28:00.936196
6d4e0bf9-e174-49cd-9ea8-fdadedc58cfe	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	2026-03-30 13:28:04.40458
5dc818e5-8cc4-4573-878a-92b194ef9b79	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000004	\N	2026-03-30 13:29:12.013238
54ec4ffc-847c-4ffb-b45b-3b41c7f1ac5f	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	ea4071cb-2565-4386-b88d-d3a7fe8b40d1		\N	2026-03-30 13:29:12.013238
fdd55b77-d907-483d-8e62-ad7eaaccbeed	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	2026-03-30 13:29:16.50981
657b03e7-8f83-4a26-b331-31a16baa36d4	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000002	\N	2026-03-31 10:48:13.528255
a24715c6-0276-49c3-894e-0a2536dc4a60	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	096386e4-2c48-440a-89a6-2ca2d9faab87		\N	2026-03-31 10:48:13.528255
b487bfc6-2e96-4a5d-a727-ab309e3f3b19	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	2026-03-31 10:48:16.14396
34fc22f3-819f-40ca-9d0c-59b4ab1fba4e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000003	\N	2026-03-31 10:48:25.146385
ad16e532-a079-4c7c-b4fe-57f4348435ae	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	7d85a7cc-b5f8-4e90-b670-d7825244f12d		\N	2026-03-31 10:48:25.146385
959b1bdb-076e-433c-8244-47c01ff5523f	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-03-31 10:48:28.008674
02b56ae6-7a3c-4389-bd80-ea651671955b	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:39.695509
0ab01b33-e0cc-4f25-acac-d295c88eb065	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:41.906091
2431fff9-b464-4d72-89b2-4aa8628ca884	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:42.498339
260ae532-2698-4c5a-9bca-c57eca3993c3	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:42.714788
d9a0db13-12c4-4f8c-b293-8ad5a74f93f5	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:42.821287
88ab214c-932d-4a3e-8d8c-fbe7e24ce604	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:42.97645
1975bc9e-5396-45e6-ba7b-9677a869efe7	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	hello	2026-03-31 10:48:43.159409
739261d1-32e9-4ac8-8e4d-03d621263523	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Test note for immediate display - timestamp 1774954602794	2026-03-31 10:56:48.526001
c80edea4-1ce2-486e-912c-aa52f888d1d3	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-03-31 11:23:58.108636
9a3b6664-b0ea-484b-9b4b-e07a20a7bf80	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	company	Acme Corp Ltd	Acme Corp Updated	\N	2026-03-31 11:24:31.867473
b8226446-56dc-49d0-a4dc-e0591d2bb161	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000003	\N	2026-03-31 13:01:31.974362
eb4b9dc3-2521-4563-a205-674c1d1fef77	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	096386e4-2c48-440a-89a6-2ca2d9faab87	7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	2026-03-31 13:01:31.974362
a429414a-333c-4690-9ec0-e2456f9d7e42	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000002	\N	2026-03-31 13:05:07.940998
34f636e0-2d39-4688-bd01-eaa13978462e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	6a0506fd-b1a5-492e-a86d-b5b04020287b	ea4071cb-2565-4386-b88d-d3a7fe8b40d1	\N	2026-03-31 13:05:07.940998
71e45776-76cb-4833-a2c1-282071a3d5b3	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000002	\N	2026-04-01 04:51:53.017665
39cc11a2-fb5c-47e1-b19b-8ccfd3b00b9c	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	7351f62e-ff30-4d5c-877b-4d93159a73b6	ea4071cb-2565-4386-b88d-d3a7fe8b40d1	\N	2026-04-01 04:51:53.017665
3a5d0b90-7082-4a74-9b4e-aa7d6bd5aec8	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000001	\N	2026-04-01 04:51:55.945688
cba91cd5-223d-484e-a26e-228679cea8c9	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	ea4071cb-2565-4386-b88d-d3a7fe8b40d1	096386e4-2c48-440a-89a6-2ca2d9faab87	\N	2026-04-01 04:51:55.945688
53d716e2-199d-4cde-9de0-4020283fcbc1	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000003	\N	2026-04-01 04:51:59.620724
cce40b5d-22f8-4003-884a-2379c90f0254	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	096386e4-2c48-440a-89a6-2ca2d9faab87	7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	2026-04-01 04:51:59.620724
9d10be51-823e-4ea2-85f3-43da083fe574	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000004	a1000000-0000-0000-0000-000000000001	\N	2026-04-02 08:06:34.670096
7c53526e-06b0-4f7f-a3d0-bae2807a60c1	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000004	\N	2026-04-02 08:06:36.106887
feffb614-1c66-460a-a625-76c0f932f72b	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-04	\N	2026-04-02 08:28:20.660109
4a33c357-7d86-4967-9615-64b4d60291d2	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadOwner	310846dc-de7c-4f2b-b9c0-114caa198d7a	89418507-4295-4d0e-a5d3-eed3e9738eaf	\N	2026-04-03 07:24:09.2204
8853e381-2f55-4ffa-bac6-625535e26c08	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadOwner	89418507-4295-4d0e-a5d3-eed3e9738eaf		\N	2026-04-03 07:24:11.487649
d8f6e957-21a9-4ba2-83bf-abbeed67f7f6	bb183adb-556a-4dd5-bbd6-b7096a7e9af8	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-05	\N	2026-04-03 08:08:12.185692
eb67d7fb-c95c-4545-9f62-2a4fdf90a21c	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-05	\N	2026-04-03 08:08:28.060298
8036f06b-92c2-43fa-acf5-f72df342cb73	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-05	\N	2026-04-03 08:15:29.725782
68812325-72f2-45ee-a9bb-8e04ee8e6e56	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-06	\N	2026-04-04 10:36:09.871061
7946193f-1449-4738-ad72-cf5275075405	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadOwner	310846dc-de7c-4f2b-b9c0-114caa198d7a	accf25b5-955d-4545-aa76-9132f8785c43	\N	2026-04-06 11:51:21.065959
6bbf9cbd-7ad5-41c5-ba52-ef447207e0de	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate		2026-04-08	\N	2026-04-06 11:51:29.75686
6cb521d9-17c9-42f2-8910-430dfe7a3a08	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	dealHandler		accf25b5-955d-4545-aa76-9132f8785c43	\N	2026-04-06 11:51:33.368525
ea8544e1-bbaf-44e1-97ee-410c9ee81d57	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadOwner		310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	2026-04-06 11:51:35.003862
83e72b86-28d8-4847-8fc5-06d4a144657d	afe3a620-85c0-4c68-b57d-421a1094f478	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 12:51:56.965961
bb110c72-9ec6-45d7-85e8-9df4130ed964	bae12464-6114-4766-8c46-07a5e84bbbb3	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 12:54:27.400839
770e77a3-63f6-4c15-a15c-5dc0f9a13028	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 12:56:29.606373
06982167-6d14-4c9c-86b6-298cb1ea1760	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is a test note being added for yes	2026-04-06 12:56:47.086405
df37a55d-c6f1-43ab-8eb9-fe17d240b76f	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is a test note being added for yes	2026-04-06 12:56:49.135702
a654d75b-45ba-48fe-85ed-1ae1572e1c6a	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	warm	hot	\N	2026-04-06 12:56:58.095886
d83f9e0f-1af7-44a3-a050-6cbafbaff7cd	5a5bd4e2-0258-4bce-8a4d-86d6a9ab2954	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 12:57:33.885732
411f64ab-7571-4c30-8589-0d79cb4257fd	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId		a1000000-0000-0000-0000-000000000002	\N	2026-04-06 13:04:35.768087
a031584b-b9aa-40bf-9f28-36b457544a22	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	2026-04-06 13:04:37.062926
81df6278-cbbb-4141-abbe-e018c578d582	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	dealValue		1000000	\N	2026-04-06 13:04:42.832895
675716de-9508-40f2-b567-9661124917a1	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	contactEmail		ai.ortllp@gmail.com	\N	2026-04-06 13:04:44.060446
a6bb60ca-4ebb-4569-93f1-c87060fbd2e4	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	phone		8779909955	\N	2026-04-06 13:04:47.86457
368bcef3-5c8f-4c5e-aa5b-946c170e8742	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	serviceId		6533c5ca-c650-4f8c-a0ee-2561197d955e	\N	2026-04-06 13:04:48.985356
968defb8-e98f-4cde-bf71-2c2fd0de9181	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	nextAction		here is the next action for the lead	\N	2026-04-06 13:05:10.038733
d8577c65-570c-41ef-869a-38f1d7ac12a5	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	nextAction	here is the next action for the lead	next action	\N	2026-04-06 13:05:36.975389
7c125dcf-7f8a-4bc5-8bae-8908d8422f61	2dd5a515-dfbf-436b-87bb-117213bcc5db	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	dealHandler		89418507-4295-4d0e-a5d3-eed3e9738eaf	\N	2026-04-06 13:05:57.329192
2243e80e-cd11-472e-b05a-5c8ea44d2849	d243a5c3-fb43-4aa4-b73b-cee0c73caa23	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 13:08:18.688737
ed312ad3-60ed-4df4-bbf5-a079575bc2fc	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-06 13:08:26.989517
b3c91ca2-0320-43e9-bea2-74bec8655e59	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Test note for duplicate prevention check	2026-04-06 13:29:00.840629
523c256e-c034-453f-a6e0-69a35ac25838	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Spam click test	2026-04-06 13:29:23.402377
bf09d89d-29f3-4850-8541-0591638b472f	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Spam click test	2026-04-06 13:29:53.044092
2c3fb62c-0deb-4cb2-af07-9a7e4297f82d	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	RapidClickDedupTest	2026-04-06 13:32:05.028444
26d5657d-8bba-42b2-bf34-7a7f3349689b	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	RapidClickDedupTest	2026-04-06 13:32:19.129092
cb778bd9-b952-4aab-a030-0a60b431c68e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	DeduplicationRapidTest	2026-04-06 13:36:00.328296
018c1db6-2552-474c-9be6-c38044b050f0	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	DeduplicationRapidTest	2026-04-06 13:37:11.937968
4a0eea71-9b33-462e-aa1e-8f43433813eb	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	UNIQUE_1775482749038	2026-04-06 13:40:34.455878
3b198cdd-53f5-48dc-b926-7bafdcbcf9a8	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	LoadingStateTest_1775482749038	2026-04-06 13:41:50.718769
510f22b8-1997-4cd9-9fb0-21c6d14546f9	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	testing note for lead	2026-04-06 13:50:42.793221
24d5a32a-1de2-4d56-bd0b-374569d37c45	d243a5c3-fb43-4aa4-b73b-cee0c73caa23	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	cold	hot	\N	2026-04-06 13:51:13.739494
c8026162-0c51-4c83-a5b4-535ec00d43ab	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	warm	hot	\N	2026-04-06 13:51:34.143878
babc9d48-eec5-442f-88ea-d0e097664e63	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	hot	ghosted	\N	2026-04-06 13:51:53.793032
06d846d7-3869-46ef-be20-0236fdf472af	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	ghosted	hot	\N	2026-04-06 13:52:19.221015
35986f12-ae41-4b26-acd5-e9be9835403a	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	nextAction		FollowUpCall_AutoRefreshTest	\N	2026-04-06 14:01:25.837334
a37a2ece-3633-41be-ab7b-fee1febbfffd	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	hot	cold	\N	2026-04-06 14:06:11.493091
0391cc4c-4cb5-4f21-a05d-5bc5a45301c9	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	serviceId	af2e6bd0-0778-4f82-974c-cb2928c77567	03f92284-6e9a-4360-a5c4-dda04cc53545	\N	2026-04-06 14:30:48.654771
38e49194-1f75-4dd3-ba7e-42d38af258b8	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	serviceId	03f92284-6e9a-4360-a5c4-dda04cc53545	af2e6bd0-0778-4f82-974c-cb2928c77567	\N	2026-04-06 14:30:55.278133
930e23bc-25fe-4881-8c16-7965171fb34e	d243a5c3-fb43-4aa4-b73b-cee0c73caa23	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Test reorder note	2026-04-07 05:33:17.138935
5c7fef16-9655-4271-8ede-bf64821402e4	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	cold	hot	\N	2026-04-07 05:42:24.712871
bc95d583-a71b-4b1c-8dd1-8e5bf2cb4149	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-04-07 05:42:43.216544
d2f18796-777e-474d-a7fd-07b37bdfc92f	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	ea4071cb-2565-4386-b88d-d3a7fe8b40d1	7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	2026-04-07 05:42:54.708761
83d3c37b-070c-4817-8468-5378ad18e2bf	5a5bd4e2-0258-4bce-8a4d-86d6a9ab2954	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000003	\N	2026-04-07 06:01:25.106011
04e51bf5-11b5-4e57-9ca2-c829c7b25eba	5a5bd4e2-0258-4bce-8a4d-86d6a9ab2954	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	2026-04-07 06:01:27.994815
b7cc45d5-df37-48b4-bee6-1628bc75d95a	9b5841ea-243b-4f25-9331-fbd6158211a0	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-07 06:07:19.605337
eb5bb513-6ebc-4ab1-94e6-8b3d6202db34	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate	2026-04-04	2026-04-08	\N	2026-04-07 06:38:11.150474
9246a662-a353-4168-9c17-d2e5003c7b0f	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	followUpDate	2026-04-08	2026-04-07	\N	2026-04-07 06:38:33.447323
395cbe65-98de-48cd-8f4d-165f89961944	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000004	a1000000-0000-0000-0000-000000000002	\N	2026-04-07 06:39:41.780595
061c4e99-7a03-4ddf-8915-6f31b04d4761	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	0447566e-ed25-4faa-ac98-58cc95b60c04		\N	2026-04-07 06:39:41.780595
86709b6d-9bc7-4d07-8688-1a8793d3e667	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		be729a68-4a26-41ef-ada9-650ca35947b3	\N	2026-04-07 06:39:43.076798
a764e2d9-0437-4f2c-9212-1e13c323bc07	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000004	a1000000-0000-0000-0000-000000000003	\N	2026-04-07 06:39:49.672401
92a5b67e-350c-4284-b54b-15ce0c26bf31	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	0c34315f-d4e6-47b0-9160-e9951ebed9df		\N	2026-04-07 06:39:49.672401
fcf0132b-902b-47b1-9a9d-6663373d5d5f	d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-04-07 06:39:51.110175
778be199-0759-49bb-b4df-3a671bc7306e	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	today meeting was all about discussing the company profile. Next meeting will be regarding the software demo\n\nFollow-up date - 11/04/2026	2026-04-08 13:15:43.721286
913285fd-7024-42c1-8ecd-fc8df305010b	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is a new lead testing	2026-04-08 14:08:51.763843
ad46b1cd-f79c-490b-8eb9-659ddcdd4638	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Test follow-up note	2026-04-08 14:12:00.654802
2302bf7e-34ce-4443-bce6-a04640ed947e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Test follow-up note	2026-04-08 14:12:11.358334
9c46e791-6a7c-4259-b64f-ffddac018ca8	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-08 14:16:46.478096
9e20ca4a-6382-46d7-afa4-81addb655133	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is new note and follow up test session	2026-04-08 14:17:37.954967
4cd2f69a-0b72-419d-9d00-a7a3938f30d8	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is new note and follow up test session 123456	2026-04-08 14:18:32.463655
6b108c9e-3eea-456e-891d-abf97c1b61a8	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	this is new note and follow up test session	2026-04-08 14:18:59.712598
154ea364-885d-4d1f-a25c-e86fc981f1db	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	nextAction	these are the next step that are to be taken for this new lead	test action	\N	2026-04-08 14:19:18.622131
0bdfe896-7988-4939-8656-d101cec435e4	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	7351f62e-ff30-4d5c-877b-4d93159a73b6	6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-04-08 14:19:38.166109
24c87e65-b7dd-4c13-9016-05f1c36f35b9	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Notes enhancement test 1775658832638	2026-04-08 14:34:01.889586
0028128e-fcef-4d64-812d-8a42b2cd817d	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Initial call went well — siddharth karanjekar is very interested in CRM implementation. Follow up next week with demo.	2026-04-08 14:37:14.539175
24a71f20-36db-47b5-af8e-bb8508761104	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Header badge test	2026-04-08 14:46:51.922829
0592e3af-5702-46b5-ba85-2663eb618b87	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Real-time badge test	2026-04-08 14:51:07.566239
73b8a4cd-0e8f-467f-9c15-d35512ff1b4e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Header badge realtime test	2026-04-08 14:54:25.006147
249f11d8-2d46-4cd1-b86e-101ed2c2960e	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Header badge realtime test 88	2026-04-08 14:56:23.586373
7230b343-4c52-4dd2-969e-003725151061	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000002	\N	2026-04-08 14:57:20.371817
c73c11dd-5abd-462f-96dc-b531e3253963	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	6a0506fd-b1a5-492e-a86d-b5b04020287b		\N	2026-04-08 14:57:20.371817
ebb30745-1d59-4da4-959d-96706770c92b	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		be729a68-4a26-41ef-ada9-650ca35947b3	\N	2026-04-08 14:57:22.452998
c9f4948c-0420-44c9-b1f6-5bd2d5030956	619b091a-0ca0-44ca-9d66-04fdb30a7262	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-08 15:13:35.923448
dbf4557b-31e3-4b53-a54d-b4d7a624435b	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-08 15:21:40.928219
238209a9-8bd6-4420-aab1-8aa6329b71b7	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Type a new note„.sid testing notes and follow up functionality	2026-04-08 15:22:39.596037
dd41b982-4da8-492e-9ea0-3f981ebf83eb	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadType	warm	hot	\N	2026-04-08 15:23:13.50709
c4d97bcf-97fe-4318-8bec-c86c68a68d96	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	nextAction	Next steps or initial contex	Next steps or initial contex1234	\N	2026-04-08 15:23:19.954801
54b80776-2814-4df1-9ae8-ebce0b49d491	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	got a new date, chalooo	2026-04-08 15:23:52.085136
78a969e6-71c0-4b3c-b649-f549a3ac52c5	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	fvfdv	2026-04-08 15:24:36.837738
35c5dadc-7889-42fa-9e81-5a1dc952af5b	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-10	Timeline test note — checking fix	2026-04-08 15:36:23.760427
6ee42b45-f58b-46b1-ba4d-70fa81e47006	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	Note without follow-up date	2026-04-08 15:37:43.505733
80dca686-0a3f-4e4f-80ef-f8d8569e27cf	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-09	testing vtesting testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing 	2026-04-08 15:39:48.387361
bb78fb08-39b1-48ed-82f9-79ae28579298	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-10	testing testing testing testing testing testing 132323232323232323232323232323	2026-04-08 15:40:09.530747
9c888fcb-e01f-4ec2-b075-b8eb12623002	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	\N	testing testing testing testing testing testing testing testing 112121212212121212121212	2026-04-08 15:40:29.421044
6ab4dbb4-78c6-4f7a-ac83-5e8bfc0936f6	9b5841ea-243b-4f25-9331-fbd6158211a0	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-11	meeting was good, next meeting will be for follow up	2026-04-09 12:07:55.838939
d1d81530-9823-475a-a7e4-7964e7d62846	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000004	\N	2026-04-09 12:12:05.939609
03498e51-8b3d-463d-bb4b-e62f35e7b0d8	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	7351f62e-ff30-4d5c-877b-4d93159a73b6	0447566e-ed25-4faa-ac98-58cc95b60c04	\N	2026-04-09 12:12:05.939609
9ebcf1a7-7390-4bde-981e-3d28fc6516bb	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000001	\N	2026-04-09 12:12:09.780363
79c5228b-3508-45a1-8dff-cd83bc17b492	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	be729a68-4a26-41ef-ada9-650ca35947b3	096386e4-2c48-440a-89a6-2ca2d9faab87	\N	2026-04-09 12:12:09.780363
e9af8d33-39ff-4a95-aea5-8f21d65c166f	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000004	\N	2026-04-09 12:12:25.421474
a1951c20-21fe-4225-a29e-fde4438e40ce	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	be729a68-4a26-41ef-ada9-650ca35947b3	0447566e-ed25-4faa-ac98-58cc95b60c04	\N	2026-04-09 12:12:25.421474
b1c2ffdf-9a52-4eba-9a44-5725493c7a26	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000004	a1000000-0000-0000-0000-000000000002	\N	2026-04-09 12:17:36.902425
5c9a9b6e-49f4-4d36-9399-62bfbb95c069	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	0447566e-ed25-4faa-ac98-58cc95b60c04		\N	2026-04-09 12:17:36.902425
8116cf10-298c-4244-aa80-7fe488956c54	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	2026-04-09 12:17:43.202866
a2c16aac-b059-4bc6-afcd-caf465078502	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000003	\N	2026-04-09 12:17:45.24292
ad938ed5-95de-4877-8384-b62c6cdda611	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	7d85a7cc-b5f8-4e90-b670-d7825244f12d		\N	2026-04-09 12:17:45.24292
535fe4b3-8ba9-434d-b754-eb05737b4ddc	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	2026-04-09 12:17:52.704665
9617f597-b2cc-4ca6-b712-d0dce6632de2	3f5e0270-3eab-4714-9e73-e1329451056d	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-13 06:40:09.710213
082d049c-309c-4089-a1a3-243d15391a96	7e2af375-dc5a-4da1-92aa-067e14060369	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-13 06:45:53.882389
3b56cb9c-53da-4d65-8996-9c3dd0317a8e	0e990842-a1a4-4f7a-8f39-89370bfb9dff	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-13 08:29:44.850914
9ae50cb6-329e-4e51-823a-c01b0c940bed	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-13 12:30:32.099077
29c34a35-bfac-4bbe-820d-99a3b9aae7a7	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000002	a1000000-0000-0000-0000-000000000004	\N	2026-04-13 12:30:37.30874
103eaa20-08b8-47e2-881f-fa9a334fedfc	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	be729a68-4a26-41ef-ada9-650ca35947b3		\N	2026-04-13 12:30:37.30874
63d8f20e-0ae1-41e5-a089-fe1ba71a4670	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	2026-04-13 12:30:39.495995
d94949d6-ae1a-491b-8323-3bae1f6787f4	a1a2bcd8-a4ab-4b49-88e6-08eac8e94256	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-13 15:55:42.172878
b2d25bd1-7abb-41d2-991a-011951db8ce4	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-18 09:38:31.476299
87567765-2b6f-466c-969a-89a3d8e9fa05	89526e1b-3388-4032-a2d0-a9a8cf67f623	310846dc-de7c-4f2b-b9c0-114caa198d7a	created	\N	\N	\N	\N	2026-04-18 10:32:13.434556
28ff7fe6-2f4c-4b51-9d94-a055f72b56c7	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-20	TEST	2026-04-18 17:38:41.651578
e142ba21-4040-4eff-ac65-f7d480c1180a	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-20	TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST	2026-04-18 17:38:52.149524
bd9604bd-9634-45fa-ba77-cf2a482a94fc	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	note_added	\N	\N	2026-04-30	TESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST	2026-04-18 17:39:09.43834
b1cbbfd0-d68a-4bab-adb3-5fbe3b4a2589	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000004	\N	2026-04-18 18:28:49.362056
1dbe427b-e8ef-4e38-a19a-0b6a52548ab8	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	6a0506fd-b1a5-492e-a86d-b5b04020287b		\N	2026-04-18 18:28:49.362056
8ec7a954-3009-4214-87df-4f7642607b13	89526e1b-3388-4032-a2d0-a9a8cf67f623	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadKillReason		Budget constraints - test	\N	2026-04-18 18:49:14.364134
16a0ad7e-e290-42dc-bb00-ede323260077	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000004	\N	2026-04-18 18:52:42.186583
7a1cc623-0e6a-47b9-84c6-c5c428096a8c	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId	096386e4-2c48-440a-89a6-2ca2d9faab87		\N	2026-04-18 18:52:42.186583
37979ed5-056b-4696-9cff-bc2dc4ad8c84	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000001	a1000000-0000-0000-0000-000000000003	\N	2026-04-18 19:13:49.820179
dbff1b47-cd28-4f30-be34-91cb2bee0610	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStageId	a1000000-0000-0000-0000-000000000003	a1000000-0000-0000-0000-000000000004	\N	2026-04-18 19:13:52.468866
9938a73e-ef01-4a08-90ad-62996137d70b	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	2026-04-18 19:14:17.838915
fccc6b92-82c6-4155-9830-715ae79ecce9	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadKillReason		this is the test reason why the lead has been lost	\N	2026-04-18 19:14:17.838915
5f55bb65-3d0b-4df9-b1c1-1570b37c3715	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	pipelineStatusId		0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	2026-04-22 07:07:32.835239
18321d0f-6546-4dd7-89dc-ed4997a5e85a	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	field_update	leadKillReason		this lead was lost as there is was communication gap	\N	2026-04-22 07:07:32.835239
\.


--
-- Data for Name: lead_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_companies (id, lead_id, company_id) FROM stdin;
a94d0434-02bb-46db-8cb5-154e1b988096	572d184a-5d63-4ae8-9f01-06de1baa6c31	5530bbbd-f2d3-4e99-b285-44b847512e1e
20912549-8558-4c54-8cd9-fb6fb74faeee	f520140c-4f02-407b-863e-dbbca2d143c0	5530bbbd-f2d3-4e99-b285-44b847512e1e
a9ab24ca-6a66-433b-bbe7-080397bba341	bae12464-6114-4766-8c46-07a5e84bbbb3	5530bbbd-f2d3-4e99-b285-44b847512e1e
d654ad8e-c5fc-42c4-b1a3-a841a32cc7ca	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	5530bbbd-f2d3-4e99-b285-44b847512e1e
8b0f6cb7-9a9c-4f25-83ea-4b25879f6ccd	5a5bd4e2-0258-4bce-8a4d-86d6a9ab2954	5530bbbd-f2d3-4e99-b285-44b847512e1e
15de0a2f-9bb1-4b97-babb-be9710b894d5	2dd5a515-dfbf-436b-87bb-117213bcc5db	cdf5b68d-1e47-453b-bc3e-d65718f57861
e36051b3-7c07-4e6d-baae-48352845e239	2dd5a515-dfbf-436b-87bb-117213bcc5db	5530bbbd-f2d3-4e99-b285-44b847512e1e
d283c78e-75e9-4479-b7f6-0a355a73887b	d243a5c3-fb43-4aa4-b73b-cee0c73caa23	5530bbbd-f2d3-4e99-b285-44b847512e1e
d108c34c-8f06-4bff-804d-97efbea941c5	9b5841ea-243b-4f25-9331-fbd6158211a0	5530bbbd-f2d3-4e99-b285-44b847512e1e
0230023d-9320-48e9-8bd0-25b6cd595399	f1d5520a-d178-4692-8d42-84a84565cc68	5530bbbd-f2d3-4e99-b285-44b847512e1e
339c4e8d-1c1c-443c-9d71-41daf17f554a	0e990842-a1a4-4f7a-8f39-89370bfb9dff	5530bbbd-f2d3-4e99-b285-44b847512e1e
3b8753ec-090b-416b-b071-4e920fb229d9	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	5530bbbd-f2d3-4e99-b285-44b847512e1e
bbd08180-abe1-4949-88f8-6cacca25968d	11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	cdf5b68d-1e47-453b-bc3e-d65718f57861
1e2b0ab0-6a6f-4a9b-8978-5786612e4c7d	a1a2bcd8-a4ab-4b49-88e6-08eac8e94256	cdf5b68d-1e47-453b-bc3e-d65718f57861
03619a00-6673-402d-9ddc-3d994d777fce	a1a2bcd8-a4ab-4b49-88e6-08eac8e94256	5530bbbd-f2d3-4e99-b285-44b847512e1e
4fd737f8-6189-40c8-8306-bb8efd415fbc	a1a2bcd8-a4ab-4b49-88e6-08eac8e94256	b6b62a92-9112-4828-a158-2f047e7584c0
544b78a4-42d8-4423-99d3-c6f95d5270f4	61046ef7-89a1-4772-bfe8-6e6842806330	cdf5b68d-1e47-453b-bc3e-d65718f57861
2ad850e7-e5d5-42dc-a64d-3b8b636b0e7f	61046ef7-89a1-4772-bfe8-6e6842806330	5530bbbd-f2d3-4e99-b285-44b847512e1e
aa92a869-7e4b-4431-a065-98b94d727fdc	61046ef7-89a1-4772-bfe8-6e6842806330	b6b62a92-9112-4828-a158-2f047e7584c0
\.


--
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_notes (id, lead_id, user_id, content, stage_context, created_at, follow_up_date) FROM stdin;
8f1e63ac-052b-47e3-8a34-421f0f4d0c7c	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	Initial call went well — Rajesh is very interested in CRM implementation. Follow up next week with demo.	\N	2026-03-27 18:40:35.567961	\N
5bb0c26a-e10e-458a-8134-5875e529ed2d	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	Sent proposal for ₹2,50,000. Awaiting internal approval from their finance team.	\N	2026-03-27 18:40:35.567961	\N
4c7c40f3-7232-47d1-a941-5aa6a69e8411	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:39.639624	\N
da87bca7-fc76-45b6-9e6b-a76ed670726c	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:41.902792	\N
33916068-3790-4f33-ac41-614a0fd0783a	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:42.495809	\N
b4925e61-9712-41b9-8459-31053fee9496	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:42.657005	\N
0b6c3dbc-ad1f-4315-b7cb-6d84a5fe8088	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:42.819107	\N
b04a462e-922c-43d5-8a3a-377d6ca77845	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:42.973106	\N
9be4731f-0b42-48cd-8bdc-11af088e593f	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	hello	\N	2026-03-31 10:48:43.157002	\N
c7cb8ba0-4235-476d-a71c-a980ddc7e63d	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is a test note being added for yes	\N	2026-04-06 12:56:47.08021	\N
a5720d54-e1e9-4109-9fb1-2588bfb9a699	ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is a test note being added for yes	\N	2026-04-06 12:56:49.132806	\N
427369a0-b35c-46af-8175-fee06c804820	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Test note for duplicate prevention check	\N	2026-04-06 13:29:00.814028	\N
00818cef-5dc7-4e1f-abc4-705d1d912aa8	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Spam click test	\N	2026-04-06 13:29:23.389184	\N
54a4757f-7407-4e78-a02e-b9b2c01dd8e9	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Spam click test	\N	2026-04-06 13:29:53.039983	\N
d86d0cf6-1c9f-4be2-ac31-2ae05ae0e3f3	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	RapidClickDedupTest	\N	2026-04-06 13:32:04.992497	\N
a4c53cef-d7bd-4203-8859-de62fcc51088	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	RapidClickDedupTest	\N	2026-04-06 13:32:19.123743	\N
b281468a-d03c-47d8-818d-5b8465e5751c	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	DeduplicationRapidTest	\N	2026-04-06 13:36:00.292865	\N
a6c28c69-524d-4a53-a91c-b3be60c7e3aa	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	DeduplicationRapidTest	\N	2026-04-06 13:37:11.899922	\N
8646a2ed-f72e-4743-afb5-a3b71e889395	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	UNIQUE_1775482749038	\N	2026-04-06 13:40:34.422131	\N
ddf2e660-5637-4dc6-851f-cd307b60a03a	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	LoadingStateTest_1775482749038	\N	2026-04-06 13:41:50.679301	\N
bf92f647-dcd0-46c9-bbf1-411ede0eb0bc	21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	310846dc-de7c-4f2b-b9c0-114caa198d7a	testing note for lead	\N	2026-04-06 13:50:42.768325	\N
ae84d124-1313-499d-bb7f-a1fcb99b674a	d243a5c3-fb43-4aa4-b73b-cee0c73caa23	310846dc-de7c-4f2b-b9c0-114caa198d7a	Test reorder note	\N	2026-04-07 05:33:17.037147	\N
a69a55da-9c84-4613-92ba-ac9a1a9e477f	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	today meeting was all about discussing the company profile. Next meeting will be regarding the software demo\n\nFollow-up date - 11/04/2026	\N	2026-04-08 13:15:43.52098	\N
b1e73ed9-e2bc-40b4-8eaa-e5031fd3ec34	f520140c-4f02-407b-863e-dbbca2d143c0	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is a new lead testing	\N	2026-04-08 14:08:51.725839	2026-04-08
31bf7fb4-e392-4f42-83db-c12173a0d81b	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Test follow-up note	\N	2026-04-08 14:12:00.620176	2026-04-11
22f039ae-948f-464e-b0f9-905f8e60747c	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Test follow-up note	\N	2026-04-08 14:12:11.354168	2026-04-10
e3b6ff60-9fe7-4819-b370-2064b50a9f7c	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is new note and follow up test session	\N	2026-04-08 14:17:37.950911	2026-04-09
a109a792-48fd-44f8-ae5a-b18c2ddfe728	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is new note and follow up test session 123456	\N	2026-04-08 14:18:32.430774	2026-04-08
31a05052-8c57-4c38-acb7-1a948cc4ba19	26161c88-82ed-4589-957a-e01fa42d12d2	310846dc-de7c-4f2b-b9c0-114caa198d7a	this is new note and follow up test session	\N	2026-04-08 14:18:59.708899	2026-04-01
e244f1df-22b7-4c40-8bb4-504124dc2ae5	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	Notes enhancement test 1775658832638	\N	2026-04-08 14:34:01.801715	2026-04-10
ed849e7e-12cd-4fa3-be81-f8960a6c49a0	77359f4d-426d-4d11-899f-938eea5bc7bc	310846dc-de7c-4f2b-b9c0-114caa198d7a	Initial call went well — siddharth karanjekar is very interested in CRM implementation. Follow up next week with demo.	\N	2026-04-08 14:37:14.505875	2026-04-11
707e24ae-bb45-49f5-ab0e-e1a34937b50c	572d184a-5d63-4ae8-9f01-06de1baa6c31	310846dc-de7c-4f2b-b9c0-114caa198d7a	Header badge test	\N	2026-04-08 14:46:51.888926	2026-04-10
e087713b-4fdb-4aaf-8213-1cf0aaaad48f	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Real-time badge test	\N	2026-04-08 14:51:07.53223	2026-04-15
e8e5f0b1-974e-49c8-b1e1-d6e9da7994d4	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Header badge realtime test	\N	2026-04-08 14:54:25.001052	2026-04-10
e0062318-20cc-47bb-9548-a466d80ab08c	6193c857-40ee-4721-a3f3-6f9e2ef2b648	310846dc-de7c-4f2b-b9c0-114caa198d7a	Header badge realtime test 88	\N	2026-04-08 14:56:23.553235	2026-04-18
d581ba25-8a68-41b4-b011-c3abb04b176b	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	Type a new note„.sid testing notes and follow up functionality	\N	2026-04-08 15:22:39.592663	2026-04-08
de2edf92-06ea-4986-ba7e-a9668e2d1c34	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	got a new date, chalooo	\N	2026-04-08 15:23:52.081856	2026-04-13
9cdd63e0-bf66-4dc0-87bc-4269a2a887c2	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	fvfdv	\N	2026-04-08 15:24:36.833121	2026-04-15
3abf9a2b-fe73-48ea-8908-68a526734736	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	Timeline test note — checking fix	\N	2026-04-08 15:36:23.608315	2026-04-10
4cbabc5c-577e-4546-b53e-f68a4fa1331d	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	Note without follow-up date	\N	2026-04-08 15:37:43.47221	\N
f593f3d5-98a8-400c-88e2-2fd4da840403	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	testing vtesting testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing testing 	\N	2026-04-08 15:39:48.383125	2026-04-09
1941a990-85b2-434c-84ac-d9e759bef729	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	testing testing testing testing testing testing 132323232323232323232323232323	\N	2026-04-08 15:40:09.527923	2026-04-10
1d18b73c-37d1-4a18-b567-57ba4fde4987	f1d5520a-d178-4692-8d42-84a84565cc68	310846dc-de7c-4f2b-b9c0-114caa198d7a	testing testing testing testing testing testing testing testing 112121212212121212121212	\N	2026-04-08 15:40:29.386093	\N
d0379f53-e13d-44d2-ae19-8ac2df5ad52a	9b5841ea-243b-4f25-9331-fbd6158211a0	310846dc-de7c-4f2b-b9c0-114caa198d7a	meeting was good, next meeting will be for follow up	\N	2026-04-09 12:07:55.5658	2026-04-11
efcfee28-ea60-4296-8b96-87393d797a2c	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	TEST	\N	2026-04-18 17:38:41.614035	2026-04-20
c6703351-361d-4cd2-a806-7d4baf565cad	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST	\N	2026-04-18 17:38:52.145749	2026-04-20
598147f2-89c8-43f0-9716-eadb921e6bfd	61046ef7-89a1-4772-bfe8-6e6842806330	310846dc-de7c-4f2b-b9c0-114caa198d7a	TESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST	\N	2026-04-18 17:39:09.434948	2026-04-30
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, lead_name, created_by, stage, lead_type, contact_email, phone, service_id, company, lead_owner, deal_handler, deal_value, value, follow_up_date, next_action, source_context, emotional_state, decision_role, strategic_tier, custom_hook, objection, outcome, kill_reason, internal_rating, resolved_at, friction_point, created_at, updated_at, pipeline_stage_id, pipeline_status_id, description, lead_kill_reason) FROM stdin;
9b5841ea-243b-4f25-9331-fbd6158211a0	Yes securities 1234 (Copy)1234	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	yessecurities@gmail.com	8779909955	af2e6bd0-0778-4f82-974c-cb2928c77567	Vijay	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	600000	\N	2026-04-09	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 06:07:19.55905	2026-04-09 12:07:55.927	a1000000-0000-0000-0000-000000000003	\N	\N	\N
d4b7b0dc-e0e1-41c8-8f4d-71d23efb5ef3	Meera Nair	310846dc-de7c-4f2b-b9c0-114caa198d7a	qualification	warm	meera@keralaspices.com	+91-9567890123	6533c5ca-c650-4f8c-a0ee-2561197d955e	Kerala Spices Ltd	310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	320000	\N	2026-04-05	\N	website	enthusiastic	champion	\N	\N	\N	\N	\N	\N	2026-03-30 13:29:16.506	\N	2026-03-27 18:40:35.54121	2026-04-07 06:39:51.107	a1000000-0000-0000-0000-000000000003	6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	\N
572d184a-5d63-4ae8-9f01-06de1baa6c31	CompanyBadgeTest Lead	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	\N	\N	af2e6bd0-0778-4f82-974c-cb2928c77567	\N	310846dc-de7c-4f2b-b9c0-114caa198d7a	accf25b5-955d-4545-aa76-9132f8785c43	\N	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 12:12:05.906	\N	2026-03-30 07:44:22.899385	2026-04-09 12:12:05.906	a1000000-0000-0000-0000-000000000004	0447566e-ed25-4faa-ac98-58cc95b60c04	\N	\N
d243a5c3-fb43-4aa4-b73b-cee0c73caa23	Yes securities 1234 (Copy)	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	yessecurities@gmail.com	8779909955	af2e6bd0-0778-4f82-974c-cb2928c77567	Vijay	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	600000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:08:18.644088	2026-04-07 05:33:17.143	a1000000-0000-0000-0000-000000000002	\N	\N	\N
f520140c-4f02-407b-863e-dbbca2d143c0	Sunita Reddy	310846dc-de7c-4f2b-b9c0-114caa198d7a	resolution	hot	sunita@indiafirst.com	+91-9345678901	af2e6bd0-0778-4f82-974c-cb2928c77567	IndiaFirst Bank	\N	\N	750000	\N	2026-04-07	\N	cold_call	enthusiastic	economic_buyer	high	\N	\N	closed	\N	\N	2026-03-20 18:40:35.537	\N	2026-03-06 09:30:00	2026-04-08 14:08:51.766	a1000000-0000-0000-0000-000000000002	be729a68-4a26-41ef-ada9-650ca35947b3	\N	\N
bb183adb-556a-4dd5-bbd6-b7096a7e9af8	Priya Sharma	310846dc-de7c-4f2b-b9c0-114caa198d7a	strategy	warm	priya@globalbridge.com	+91-9123456789	19dcdcf9-58b6-4388-bad6-1f033c1f7ea0	GlobalBridge Consulting	310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	500000	\N	2026-04-05	\N	linkedin	skeptical	gatekeeper	med	\N	\N	\N	\N	\N	\N	\N	2026-03-27 18:40:35.54121	2026-04-03 08:08:11.914	a1000000-0000-0000-0000-000000000003	7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	\N
77359f4d-426d-4d11-899f-938eea5bc7bc	Rajesh Kumar	310846dc-de7c-4f2b-b9c0-114caa198d7a	qualification	hot	rajesh@technova.com	+91-9876543210	af2e6bd0-0778-4f82-974c-cb2928c77567	TechNova Solutions	310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	250000	\N	\N	\N	referral	enthusiastic	economic_buyer	high	testing done	\N	\N	\N	\N	\N	\N	2026-03-27 18:40:35.54121	2026-04-08 14:37:14.55	a1000000-0000-0000-0000-000000000003	6a0506fd-b1a5-492e-a86d-b5b04020287b	\N	\N
3f5e0270-3eab-4714-9e73-e1329451056d	FAB Test Lead	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 06:40:09.368027	2026-04-13 06:40:09.368027	\N	\N	\N	\N
26161c88-82ed-4589-957a-e01fa42d12d2	ICICI Lombard 	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	warm	vishal.gorle@icicilombard.com	9619305162	fb84a0d6-0c13-42e6-bb86-1b1d6de71629	Mr. Vishal Gorle	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	5000000	\N	2026-04-10	test action	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 12:12:25.417	\N	2026-04-08 14:16:46.430158	2026-04-22 07:07:32.827	a1000000-0000-0000-0000-000000000004	0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	this lead was lost as there is was communication gap
7e2af375-dc5a-4da1-92aa-067e14060369	FAB Test Lead	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 06:45:53.845204	2026-04-13 06:45:53.845204	\N	\N	\N	\N
2dd5a515-dfbf-436b-87bb-117213bcc5db	Test Lead for Fields	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	ai.ortllp@gmail.com	8779909955	6533c5ca-c650-4f8c-a0ee-2561197d955e	Acme Corp Updated	accf25b5-955d-4545-aa76-9132f8785c43	89418507-4295-4d0e-a5d3-eed3e9738eaf	1000000	\N	2026-04-06	next action	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 11:23:57.75131	2026-04-06 13:05:57.297	a1000000-0000-0000-0000-000000000002	7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	\N
0e990842-a1a4-4f7a-8f39-89370bfb9dff	test	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	warm	test@gmail.com	9985573856	af2e6bd0-0778-4f82-974c-cb2928c77567	test	310846dc-de7c-4f2b-b9c0-114caa198d7a	310846dc-de7c-4f2b-b9c0-114caa198d7a	342433	\N	2026-04-15	testtesttesttesttesttest	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 08:29:44.550724	2026-04-13 08:29:44.550724	a1000000-0000-0000-0000-000000000002	\N	testtesttesttesttesttest	\N
afe3a620-85c0-4c68-b57d-421a1094f478	Amit Patel (Copy)	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	amit@finedge.com	+91-9988776655	6533c5ca-c650-4f8c-a0ee-2561197d955e	FinEdge Partners	310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	150000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:51:56.846653	2026-04-06 12:51:56.846653	a1000000-0000-0000-0000-000000000002	\N	\N	\N
bae12464-6114-4766-8c46-07a5e84bbbb3	CompanyBadgeTest Lead123	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	warm	\N	\N	af2e6bd0-0778-4f82-974c-cb2928c77567	\N	310846dc-de7c-4f2b-b9c0-114caa198d7a	accf25b5-955d-4545-aa76-9132f8785c43	\N	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:54:27.391619	2026-04-06 12:54:27.391619	a1000000-0000-0000-0000-000000000003	\N	\N	\N
5a5bd4e2-0258-4bce-8a4d-86d6a9ab2954	Yes securities 1234	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	yessecurities@gmail.com	8779909955	af2e6bd0-0778-4f82-974c-cb2928c77567	Vijay	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	600000	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:57:33.849246	2026-04-07 06:01:27.978	a1000000-0000-0000-0000-000000000003	7351f62e-ff30-4d5c-877b-4d93159a73b6	\N	\N
ab9a6593-0aba-4bcd-b562-3e72bf6fe3a8	Yes securities	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	yessecurities@gmail.com	8779909955	af2e6bd0-0778-4f82-974c-cb2928c77567	Vijay	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	600000	\N	2026-04-08	test noted for lead i have created	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 12:56:29.561151	2026-04-06 12:56:58.091	a1000000-0000-0000-0000-000000000002	ea4071cb-2565-4386-b88d-d3a7fe8b40d1	\N	\N
61046ef7-89a1-4772-bfe8-6e6842806330	test (Copy)1223	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	ai.ortllp@gmail.com	8779909955	fb84a0d6-0c13-42e6-bb86-1b1d6de71629	test	accf25b5-955d-4545-aa76-9132f8785c43	dca01c75-aa8c-45b3-839d-5c9f813d074b	400000	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 19:14:17.834	\N	2026-04-18 09:38:31.025572	2026-04-18 19:14:17.834	a1000000-0000-0000-0000-000000000004	0c34315f-d4e6-47b0-9160-e9951ebed9df	\N	this is the test reason why the lead has been lost
11747fc4-1fa4-46e5-aca8-cfd5cda5bc78	test	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	ai.ortllp@gmail.com	8779909955	6533c5ca-c650-4f8c-a0ee-2561197d955e	test	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	1000000	\N	2026-04-15	testtesttesttesttest	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 12:30:39.492	\N	2026-04-13 12:30:32.064821	2026-04-13 12:30:39.492	a1000000-0000-0000-0000-000000000004	0c34315f-d4e6-47b0-9160-e9951ebed9df	testtesttesttest	\N
6193c857-40ee-4721-a3f3-6f9e2ef2b648	Amit Patel	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	amit@finedge.com	+91-9988776655	6533c5ca-c650-4f8c-a0ee-2561197d955e	FinEdge Partners	310846dc-de7c-4f2b-b9c0-114caa198d7a	\N	150000	\N	2026-04-05	FollowUpCall_AutoRefreshTest	website	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-27 18:40:35.54121	2026-04-08 14:56:23.589	a1000000-0000-0000-0000-000000000002	7d85a7cc-b5f8-4e90-b670-d7825244f12d	\N	\N
89526e1b-3388-4032-a2d0-a9a8cf67f623	Test Cache Fix	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-18 10:32:13.215493	2026-04-18 18:49:14.359	\N	\N	\N	Budget constraints - test
a1a2bcd8-a4ab-4b49-88e6-08eac8e94256	test	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	ai.ortllp@gmail.com	8779909955	fb84a0d6-0c13-42e6-bb86-1b1d6de71629	test	accf25b5-955d-4545-aa76-9132f8785c43	dca01c75-aa8c-45b3-839d-5c9f813d074b	400000	\N	2026-04-15	testtesttesttesttesttesttest	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 15:55:42.162204	2026-04-13 15:55:42.162204	a1000000-0000-0000-0000-000000000001	096386e4-2c48-440a-89a6-2ca2d9faab87	testtesttesttesttesttesttesttest	\N
21d3df5b-4d19-40b4-a82d-1be9ed6ccb72	CompanyBadgeTest Lead123 (Copy)	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	\N	\N	af2e6bd0-0778-4f82-974c-cb2928c77567	\N	310846dc-de7c-4f2b-b9c0-114caa198d7a	accf25b5-955d-4545-aa76-9132f8785c43	\N	\N	2026-04-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 13:08:26.981514	2026-04-08 14:57:22.443	a1000000-0000-0000-0000-000000000002	be729a68-4a26-41ef-ada9-650ca35947b3	\N	\N
619b091a-0ca0-44ca-9d66-04fdb30a7262	E2E Test Lead Description	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	cold	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 15:13:35.88757	2026-04-08 15:16:39.996	\N	\N	Updated description via details tab	\N
f1d5520a-d178-4692-8d42-84a84565cc68	Acme Corp Expansion	310846dc-de7c-4f2b-b9c0-114caa198d7a	discovery	hot	ai.ortllp@gmail.com	876390887	af2e6bd0-0778-4f82-974c-cb2928c77567	Acme Corp	accf25b5-955d-4545-aa76-9132f8785c43	accf25b5-955d-4545-aa76-9132f8785c43	1650000	\N	2026-04-12	Next steps or initial contex1234	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 15:21:40.881787	2026-04-18 18:52:42.149	a1000000-0000-0000-0000-000000000004	\N	Brief overview of this lead — context, source, or initial notes.... siddharth testing desc	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used) FROM stdin;
1f1cab43-5a52-4e78-9a4a-428681795ccd	42b93c00-3887-4b67-afe8-44e7893bfee3	86ecd798-ff82-4c0f-a63b-d609fed06909	2026-03-31 09:02:34.042	f
aa38483f-5c41-4a9e-8a79-cc0010c69830	cfdb875a-2726-4e37-a5ce-563af3e9cd21	7ed9b886-e481-461c-b569-388f36c037ed	2026-03-31 09:02:41.692	f
fd35cca0-6ee4-4a32-83a5-1962ffc1b7b1	eb3048c5-65b9-4f37-9560-bc9e5002b8cb	bbd1de58-b215-40ed-aa3a-7f131290670f	2026-03-31 09:38:13.665	t
e5327c6d-aa76-4a2c-b280-6b6839c2dd5b	7fc3cce7-60a8-4c7b-ab2f-aaa2c9d4d2cf	0a59432c-7ba0-40e4-8fab-3e8f74b01630	2026-03-31 10:07:33.015	f
dddb123d-785e-4893-bc77-968858b4d444	643a3225-eb7c-46c3-8ffa-5f3be6de8015	ba30e4c1-58c5-4100-8a31-ba48705e7f2c	2026-04-01 06:55:11.081	f
72869717-a551-4c40-9832-1d5015c96b85	531ea48a-cc87-4b06-9436-37694f3087ff	5624abf7-fbb3-49d1-a0bf-786f6c6e2a63	2026-04-07 13:41:13.095	f
85b9c427-d995-43d6-a286-716fa8724d75	310846dc-de7c-4f2b-b9c0-114caa198d7a	a634171f-d3a6-4c16-b522-b9c9e5d0232b	2026-04-14 13:18:20.934	f
62888d84-0573-4217-b7a2-6dc7cc7d681a	89418507-4295-4d0e-a5d3-eed3e9738eaf	83795537-e257-4b37-93ba-43fe006e034e	2026-03-31 10:56:19.542	t
47af6d2f-6008-4297-a0ad-f4406540083f	89418507-4295-4d0e-a5d3-eed3e9738eaf	c6dbb52b-eb01-42f3-bfcd-a8769b7b40c8	2026-04-14 13:18:06.904	t
d31d621a-8d73-4991-85b3-4fb31029d061	89418507-4295-4d0e-a5d3-eed3e9738eaf	486875ed-0a0a-448b-b671-46288545e481	2026-04-14 13:21:10.868	t
0198647b-061e-4865-a94a-517ce554f132	89418507-4295-4d0e-a5d3-eed3e9738eaf	e383fabd-af6a-45f5-b477-689775980b3d	2026-04-14 13:22:06.302	t
0d9b4454-2f7b-496d-a9d4-218282c152e3	89418507-4295-4d0e-a5d3-eed3e9738eaf	226a70a7-9484-4c2f-9ad7-ff628bd29137	2026-04-14 13:32:34.312	f
f90bb4be-2160-4216-98fd-ad9d3a0b9782	accf25b5-955d-4545-aa76-9132f8785c43	a1e34db5-f421-4e6c-bc71-ddd192599482	2026-04-14 13:28:18.676	t
0cf7dda2-5b5c-472e-8924-30e2b82486e5	accf25b5-955d-4545-aa76-9132f8785c43	d85de8c5-6a04-4e62-bd43-6f0570ae6fdf	2026-04-14 13:34:09.979	t
cda7dbe7-a60e-4271-aced-dac4b2a91877	accf25b5-955d-4545-aa76-9132f8785c43	aa5b77fd-c781-405c-ac95-a7cb5a36adce	2026-04-14 13:34:19.552	t
9ec79468-438a-4b21-ab41-c75a53d6e869	accf25b5-955d-4545-aa76-9132f8785c43	6ab5f649-8c03-432f-822d-7845887abdfe	2026-04-14 13:34:47.269	f
9e43999a-4825-4246-9384-09397ae4670d	dca01c75-aa8c-45b3-839d-5c9f813d074b	effbaba2-ff66-44ce-84ae-eb4ef785177c	2026-04-14 13:26:17.334	t
675d63ea-4c66-43ab-b5ea-9e41dc161c51	dca01c75-aa8c-45b3-839d-5c9f813d074b	60f27754-4e9b-45fc-8751-8efb88d53ee1	2026-04-14 13:52:29.462	t
\.


--
-- Data for Name: pipeline_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipeline_stages (id, name, display_name, description, color, icon, sort_order, is_active, is_terminal, created_at, updated_at) FROM stdin;
a1000000-0000-0000-0000-000000000001	lead_initiation	Lead Initiation	First contact & capturing the lead	hsl(212, 78%, 58%)	Target	1	t	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
a1000000-0000-0000-0000-000000000002	qualification_analysis	Qualification & Analysis	Understanding if the lead is worth pursuing	hsl(36, 88%, 52%)	Search	2	t	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
a1000000-0000-0000-0000-000000000003	proposal_negotiation	Proposal & Negotiation	Converting interest into a deal	hsl(258, 62%, 62%)	FileText	3	t	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
a1000000-0000-0000-0000-000000000004	closure	Closure	Final outcome tracking	hsl(152, 58%, 43%)	CheckCircle2	4	t	t	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
\.


--
-- Data for Name: pipeline_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipeline_statuses (id, stage_id, name, display_name, description, color, sort_order, is_active, is_won, is_lost, created_at, updated_at) FROM stdin;
ea4071cb-2565-4386-b88d-d3a7fe8b40d1	a1000000-0000-0000-0000-000000000002	internal_discussion	Internal Discussion	\N	hsl(36, 88%, 52%)	1	t	f	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
7351f62e-ff30-4d5c-877b-4d93159a73b6	a1000000-0000-0000-0000-000000000003	proposal_shared	Proposal Shared	\N	hsl(258, 62%, 62%)	1	t	f	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
6a0506fd-b1a5-492e-a86d-b5b04020287b	a1000000-0000-0000-0000-000000000003	ongoing_negotiation	Ongoing Negotiation	\N	hsl(258, 62%, 62%)	2	t	f	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
0447566e-ed25-4faa-ac98-58cc95b60c04	a1000000-0000-0000-0000-000000000004	closed_won	Closed – Won	\N	hsl(152, 58%, 43%)	1	t	t	f	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
0c34315f-d4e6-47b0-9160-e9951ebed9df	a1000000-0000-0000-0000-000000000004	closed_lost	Closed – Lost	\N	hsl(4, 68%, 58%)	2	t	f	t	2026-03-30 13:06:34.512744	2026-03-30 13:06:34.512744
af448a36-d9ff-4f9b-b017-5a02f1253c96	a1000000-0000-0000-0000-000000000004	closed_postponed	Closed – Postponed	\N	hsl(36, 88%, 52%)	3	t	f	t	2026-03-30 13:06:34.512744	2026-03-31 11:37:01.666
096386e4-2c48-440a-89a6-2ca2d9faab87	a1000000-0000-0000-0000-000000000001	new_lead_connected	New Lead Connected	\N	#00397a	1	t	f	f	2026-03-30 13:06:34.512744	2026-04-13 08:03:34.239
be729a68-4a26-41ef-ada9-650ca35947b3	a1000000-0000-0000-0000-000000000002	requirement_analysis	Requirement Analysis	\N	#8a5300	2	t	f	f	2026-03-30 13:06:34.512744	2026-04-13 08:03:47.025
7d85a7cc-b5f8-4e90-b670-d7825244f12d	a1000000-0000-0000-0000-000000000002	eligibility_check	Eligibility Check	\N	#ad9571	3	t	f	f	2026-03-30 13:06:34.512744	2026-04-13 08:03:59.539
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_name, resource, action, allowed) FROM stdin;
441907d7-818f-471f-ac6b-de461af4a5eb	manager	leads	create	t
98fe74e9-bb03-49e4-9c08-d5bbaa730824	manager	leads	read	t
c2c96570-2f16-40dc-bfce-d6c1338d5580	manager	leads	update	t
e97ba13e-4c8a-4635-85b3-7d9945ee47fd	manager	leads	delete	f
6b3a3305-9ffc-47d4-b49a-06ed3cc4e31e	manager	leads	export	t
c89e63b1-1437-400c-927c-f98edd29df5f	manager	reports	read	t
254defce-692d-4b3b-865b-21acd12d7f24	manager	settings	read	f
67ae3d26-4399-4b0f-a52b-d59087b68870	manager	settings	update	f
ef8a5e5a-f2b1-4da2-984e-9900763822a0	manager	team	read	t
806572af-b766-4720-952a-afbc699e9724	manager	team	update	f
931621c0-1a1a-420f-9374-9107178eb5e6	manager	team	create	f
906198a8-918d-4c9d-8fdc-eb067813ce23	manager	audit	read	f
1c4ed6ea-bf70-49cc-bc40-355038f637ec	member	leads	create	f
dcaf708b-0d21-46be-8ac9-dcbff201dbde	member	leads	read	t
7371b9a3-c489-4c8d-939c-6b7ff08142e1	member	leads	update	f
c46aa720-a750-4449-b0f2-822fb5cdca80	member	leads	delete	f
83edecf7-d57a-4684-92eb-4bf57ff10dcd	member	leads	export	f
1188932b-7abc-40ec-ab83-9b4ca0466b22	member	reports	read	t
0c4715f5-db0b-47e0-9cd9-c133e5073f02	member	settings	read	f
4ad568ed-4f8f-4106-b56a-c9b77dff2f8c	member	settings	update	f
a2c55ded-78cb-490a-93c2-2ea042fe0533	member	team	read	f
3cb7845d-37e9-47ea-830d-5a5b13ea6f05	member	team	update	f
3031c84c-2d77-42e9-9a10-a591f48d4b81	member	team	create	f
980827ba-4f05-45f2-a3bb-fc595b0fde47	member	audit	read	f
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, category, description, created_by, created_at) FROM stdin;
af2e6bd0-0778-4f82-974c-cb2928c77567	CRM Implementation	Software	Full CRM system setup and training	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.665222
19dcdcf9-58b6-4388-bad6-1f033c1f7ea0	Digital Transformation	Consulting	End-to-end digital strategy and execution	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.665222
6533c5ca-c650-4f8c-a0ee-2561197d955e	Data Analytics	Analytics	Business intelligence and reporting solutions	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-27 18:35:08.665222
03f92284-6e9a-4360-a5c4-dda04cc53545	test new	\N	\N	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-04-03 09:53:52.362654
fb84a0d6-0c13-42e6-bb86-1b1d6de71629	Web development service	\N	\N	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-04-08 14:12:40.989319
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role) FROM stdin;
8265625b-c976-41e9-ab41-4106de63edae	310846dc-de7c-4f2b-b9c0-114caa198d7a	admin
0fd0ffc9-f466-4a0e-b1b5-c36af2acbbdd	accf25b5-955d-4545-aa76-9132f8785c43	admin
030bc938-b5a9-40ef-b6e1-7b2685c1ff02	eb3048c5-65b9-4f37-9560-bc9e5002b8cb	admin
82fb0b4d-d077-439e-9450-153a75017a41	643a3225-eb7c-46c3-8ffa-5f3be6de8015	admin
37a52888-2974-4008-b40b-6a40e334875b	531ea48a-cc87-4b06-9436-37694f3087ff	admin
6e296248-8af0-46b9-9711-fb949268d614	42b93c00-3887-4b67-afe8-44e7893bfee3	manager
866d41bd-7f3d-4b2d-99c7-835a104492b5	cfdb875a-2726-4e37-a5ce-563af3e9cd21	manager
8ca84c3c-29d0-4cc2-828a-6474b6989851	7fc3cce7-60a8-4c7b-ab2f-aaa2c9d4d2cf	manager
ddbe000b-354a-4157-b1a5-4338c9bf7291	89418507-4295-4d0e-a5d3-eed3e9738eaf	manager
014d314b-8e67-49a0-b7e9-0ad03064f105	dca01c75-aa8c-45b3-839d-5c9f813d074b	manager
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, display_name, avatar_url, created_at, updated_at) FROM stdin;
accf25b5-955d-4545-aa76-9132f8785c43	superadmin@sparkleadhub.com	$2b$12$QcLxVFE.vxKxExAu8BIIBO1.ejFWjLLbmYSeMQ1lS7PwDahV.HTRK	Super Admin	\N	2026-03-30 06:51:04.503479	2026-03-30 06:51:04.503479
42b93c00-3887-4b67-afe8-44e7893bfee3	testinviteuser123@example.com	$2b$12$5x1u6ph32fuV2w3h1ReQ8eT8PwvivYw7vCMIcdhoHUhxpLmMeI1qC	testinviteuser123	\N	2026-03-30 09:02:34.036182	2026-03-30 09:02:34.036182
cfdb875a-2726-4e37-a5ce-563af3e9cd21	testinviteuser456@example.com	$2b$12$N3a9RmszP8cfFueSp2z7/OCACkUuyeRRXHDb1tAeC.2PWM1DIB2A2	testinviteuser456	\N	2026-03-30 09:02:41.687192	2026-03-30 09:02:41.687192
eb3048c5-65b9-4f37-9560-bc9e5002b8cb	sidhuajay955@gmail.com	$2b$12$oxNND5uyQgrySdlJEyt2jOZb8WOXWZ2/JglwOrx/zzKdty/IBindW	sidhuajay955	\N	2026-03-30 09:38:13.660111	2026-03-30 09:40:17.052
7fc3cce7-60a8-4c7b-ab2f-aaa2c9d4d2cf	sparkleadhub@gmail.com	$2b$12$/9yPVKASTcmxiEW9bpXXneve1As6kZDVoNil8BGBLz7QOoL0PeRLG	sparkleadhub	\N	2026-03-30 10:07:33.00763	2026-03-30 10:07:33.00763
89418507-4295-4d0e-a5d3-eed3e9738eaf	newuser+e2e@example.com	$2b$12$oF1mbfeRcA2WLloCOHqCJeMKxBCvHIUf0nQpt/ldjvEfEjk9Aztl6	newuser+e2e	\N	2026-03-30 10:56:19.535533	2026-03-30 10:56:19.535533
643a3225-eb7c-46c3-8ffa-5f3be6de8015	viswajeet.bharti@onerooftech.com	$2b$12$55KOZe06/e.TeSJbCLmtsunZDCd/Orn7LJDbv6b8IziFwWmJwUi8S	viswajeet.bharti	\N	2026-03-31 06:55:11.074711	2026-03-31 06:55:11.074711
310846dc-de7c-4f2b-b9c0-114caa198d7a	admin@sparkleadhub.com	$2b$12$Fs4pv2vNgDZS58a5U.WiQOIOWH9UnaaNoNpk2LMHstVHTn3VA42Nm	Test Admin User	data:image/jpeg;base64,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	2026-03-27 18:35:08.563175	2026-04-03 12:06:40.194
531ea48a-cc87-4b06-9436-37694f3087ff	prithvi.thakker97@gmail.com	$2b$12$gtxjoP5uocnj0Q2MP8CVTuUhh4yXChMQldc5pFpKExLTfMf9cB./y	prithvi.thakker97	\N	2026-04-06 13:41:13.090068	2026-04-06 13:41:13.090068
dca01c75-aa8c-45b3-839d-5c9f813d074b	siddharthajay955@gmail.com	$2b$12$kfEN10RSxJJZN0Z7kW2nYeMOhnxNsnBya0sq4LV/xZef.gPgZyY6u	Siddharth karanjekar	\N	2026-04-13 13:26:17.325994	2026-04-13 13:53:21.838
\.


--
-- Data for Name: whitelisted_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whitelisted_users (id, email, status, assigned_role, invited_by, created_at, updated_at) FROM stdin;
aafad9a4-0842-4d9c-9bee-242d331ebafb	admin@sparkleadhub.com	active	admin	\N	2026-03-27 18:35:08.642942	2026-03-27 18:35:08.642942
4b548ea8-5fbc-411a-9216-79971345d6d9	superadmin@sparkleadhub.com	active	admin	\N	2026-03-30 06:51:04.481674	2026-03-30 06:51:04.481674
9fd1ab59-debe-456e-90f8-0038cb3a72c7	sidhuajay955@gmail.com	active	admin	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-30 09:38:13.3475	2026-03-30 09:38:13.3475
e8ea3489-3250-4395-9e54-830daefe85b9	viswajeet.bharti@onerooftech.com	active	admin	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-31 06:55:10.613496	2026-03-31 06:55:10.613496
df7ea8a2-61a2-42ca-9a53-ee4a9840c9f5	prithvi.thakker97@gmail.com	active	admin	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-04-06 13:41:12.779384	2026-04-06 13:41:12.779384
07e8860a-1c4d-42e8-b14d-2783a69a8aa6	testinviteuser123@example.com	active	manager	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-30 09:02:33.426062	2026-03-30 09:02:33.426062
0617a749-a147-40f8-a45a-9001c0ae3d04	testinviteuser456@example.com	active	manager	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-30 09:02:41.372263	2026-03-30 09:02:41.372263
d8e61d75-0fb7-46af-8726-e3732f8b5671	sparkleadhub@gmail.com	active	manager	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-30 10:07:32.292951	2026-03-30 10:07:32.292951
5fad1f47-ab56-426a-96ef-1c7e3ee51895	newuser+e2e@example.com	active	manager	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-03-30 10:56:19.00625	2026-04-13 15:26:37.252
e2b2dee8-e68e-46fc-b964-b7a9d35a33aa	siddharthajay955@gmail.com	active	manager	310846dc-de7c-4f2b-b9c0-114caa198d7a	2026-04-13 13:26:16.959632	2026-04-13 15:50:23.389
\.


--
-- Name: access_requests access_requests_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_email_unique UNIQUE (email);


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_services company_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_companies lead_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: pipeline_stages pipeline_stages_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_name_unique UNIQUE (name);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: pipeline_statuses pipeline_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whitelisted_users whitelisted_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_email_unique UNIQUE (email);


--
-- Name: whitelisted_users whitelisted_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_pkey PRIMARY KEY (id);


--
-- Name: access_requests access_requests_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: audit_log audit_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: companies companies_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: company_services company_services_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_services company_services_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_services
    ADD CONSTRAINT company_services_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lead_companies lead_companies_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: lead_companies lead_companies_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_companies
    ADD CONSTRAINT lead_companies_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: leads leads_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: leads leads_pipeline_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pipeline_stage_id_pipeline_stages_id_fk FOREIGN KEY (pipeline_stage_id) REFERENCES public.pipeline_stages(id);


--
-- Name: leads leads_pipeline_status_id_pipeline_statuses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pipeline_status_id_pipeline_statuses_id_fk FOREIGN KEY (pipeline_status_id) REFERENCES public.pipeline_statuses(id);


--
-- Name: leads leads_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pipeline_statuses pipeline_statuses_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_stage_id_pipeline_stages_id_fk FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id) ON DELETE CASCADE;


--
-- Name: services services_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: whitelisted_users whitelisted_users_invited_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whitelisted_users
    ADD CONSTRAINT whitelisted_users_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict GWQh7LHfBv8qn0IyPsoyHuHKvpe6svoFzT91sgPYRZJdUUd8pBrho8aRAlm9H9h


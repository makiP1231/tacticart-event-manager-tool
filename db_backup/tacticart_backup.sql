--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1.pgdg120+1)
-- Dumped by pg_dump version 16.3 (Debian 16.3-1.pgdg120+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.admin_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    content text,
    message_format character varying(50) NOT NULL,
    image_id uuid,
    admin_user_id integer,
    hold_casting_id uuid,
    CONSTRAINT admin_messages_message_format_check CHECK (((message_format)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'announce'::character varying, 'announce_hold'::character varying, 'announce_contract'::character varying])::text[])))
);


ALTER TABLE public.admin_messages OWNER TO "user";

--
-- Name: admin_nickname_permissions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.admin_nickname_permissions (
    id uuid NOT NULL,
    admin_user_id integer NOT NULL,
    artist_id uuid NOT NULL
);


ALTER TABLE public.admin_nickname_permissions OWNER TO "user";

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    full_name character varying(100),
    "position" character varying(100),
    nickname character varying(100),
    email character varying(100),
    profile_picture character varying(255)
);


ALTER TABLE public.admin_users OWNER TO "user";

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO "user";

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: artist_group_relations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.artist_group_relations (
    artist_id uuid NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.artist_group_relations OWNER TO "user";

--
-- Name: artist_groups; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.artist_groups (
    group_id integer NOT NULL,
    group_name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.artist_groups OWNER TO "user";

--
-- Name: artist_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.artist_groups_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.artist_groups_group_id_seq OWNER TO "user";

--
-- Name: artist_groups_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.artist_groups_group_id_seq OWNED BY public.artist_groups.group_id;


--
-- Name: artist_hold_casting; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.artist_hold_casting (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_uuid uuid NOT NULL,
    fee numeric(10,2),
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.artist_hold_casting OWNER TO "user";

--
-- Name: artist_messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.artist_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    content text,
    message_format character varying(10) NOT NULL,
    image_id uuid,
    CONSTRAINT artist_messages_message_format_check CHECK (((message_format)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying])::text[])))
);


ALTER TABLE public.artist_messages OWNER TO "user";

--
-- Name: artists; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.artists (
    artist_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    parts character varying(255)[] NOT NULL,
    email character varying(255),
    password character varying(255),
    admin_note text,
    profile_picture character varying(255),
    gender character varying(10),
    company_name character varying(255),
    phone_number character varying(20),
    twitter_url character varying(255),
    instagram_url character varying(255),
    facebook_url character varying(255),
    hp_url character varying(255),
    bio text,
    notes text,
    youtube_url character varying(255),
    birth_year integer,
    birth_month integer,
    birth_day integer,
    last_message_time timestamp without time zone
);


ALTER TABLE public.artists OWNER TO "user";

--
-- Name: event_casting_info; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.event_casting_info (
    id integer NOT NULL,
    event_uuid uuid,
    part character varying(255) NOT NULL,
    number integer,
    memo text,
    sort_order integer,
    sent_contract_count integer DEFAULT 0,
    signed_contract_count integer DEFAULT 0
);


ALTER TABLE public.event_casting_info OWNER TO "user";

--
-- Name: event_casting_info_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.event_casting_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_casting_info_id_seq OWNER TO "user";

--
-- Name: event_casting_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.event_casting_info_id_seq OWNED BY public.event_casting_info.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.events (
    event_uuid uuid NOT NULL,
    name character varying(255) NOT NULL,
    genre character varying(255),
    event_date date,
    open_time time without time zone,
    start_time time without time zone,
    organizer character varying(255),
    operator character varying(255),
    flyer_front_url character varying(255),
    flyer_back_url character varying(255),
    performance_type character varying(255),
    venue character varying(255),
    performance_flag character varying(255),
    original_event_uuid uuid,
    use_existing_flyers boolean DEFAULT false
);


ALTER TABLE public.events OWNER TO "user";

--
-- Name: genres; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.genres (
    id integer NOT NULL,
    label character varying(255) NOT NULL,
    value character varying(100) NOT NULL
);


ALTER TABLE public.genres OWNER TO "user";

--
-- Name: genres_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.genres_id_seq OWNER TO "user";

--
-- Name: genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.genres_id_seq OWNED BY public.genres.id;


--
-- Name: hold_casting_artists; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.hold_casting_artists (
    id uuid NOT NULL,
    hold_casting_id uuid NOT NULL,
    artist_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.hold_casting_artists OWNER TO "user";

--
-- Name: hold_dates; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.hold_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hold_casting_id uuid NOT NULL,
    hold_date date NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hold_dates OWNER TO "user";

--
-- Name: hold_notifications; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.hold_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    hold_casting_id uuid
);


ALTER TABLE public.hold_notifications OWNER TO "user";

--
-- Name: message_images; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.message_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone
);


ALTER TABLE public.message_images OWNER TO "user";

--
-- Name: messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artist_id uuid NOT NULL,
    message_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false
);


ALTER TABLE public.messages OWNER TO "user";

--
-- Name: parts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.parts (
    id integer NOT NULL,
    label character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    deletable boolean DEFAULT true,
    short_name character varying(50)
);


ALTER TABLE public.parts OWNER TO "user";

--
-- Name: parts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_id_seq OWNER TO "user";

--
-- Name: parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.parts_id_seq OWNED BY public.parts.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);
ALTER TABLE ONLY public.sessions ALTER COLUMN sess SET STORAGE MAIN;


ALTER TABLE public.sessions OWNER TO "user";

--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: artist_groups group_id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_groups ALTER COLUMN group_id SET DEFAULT nextval('public.artist_groups_group_id_seq'::regclass);


--
-- Name: event_casting_info id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.event_casting_info ALTER COLUMN id SET DEFAULT nextval('public.event_casting_info_id_seq'::regclass);


--
-- Name: genres id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.genres ALTER COLUMN id SET DEFAULT nextval('public.genres_id_seq'::regclass);


--
-- Name: parts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.parts ALTER COLUMN id SET DEFAULT nextval('public.parts_id_seq'::regclass);


--
-- Data for Name: admin_messages; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.admin_messages (id, message_id, content, message_format, image_id, admin_user_id, hold_casting_id) FROM stdin;
e9ca819d-5623-4c9c-bd45-e8397ab76361	d6f9f29b-0702-4c8b-b230-db5b8e6f840d	スペースを\n\n正しく\n\n\n扱えているかの\n\n確認です。	text	\N	1	\N
ae2e1b35-8341-4b17-969d-d8032bfe71af	ce8710f0-02a9-4f47-8840-0e7f0b5efce9	改行時、URLリンクの扱いのチェック\nhttps://www.youtube.com/watch?v=84kcLhMQBLU	text	\N	1	\N
1152656f-6e52-4477-8deb-320e1c244e0e	28a30616-efef-448c-b421-bdd46482f3e2	送信できるよね？	text	\N	1	\N
5b471511-b148-44e6-b94c-a6dd4d31c7db	83173fe6-660d-4cc7-b5c6-b3929600a156	管理者側からメッセージ送信テスト	text	\N	1	\N
8f4b3b4e-5fc8-4054-9aab-808532bf39e2	450e8654-b55b-45e9-ba71-d62e058e7e74	送信テストだよ	text	\N	1	\N
ec764fcd-30d0-41ad-911a-5f5585402a9c	ef11e9bd-c2e0-4c8b-9f6d-a265a5f3f739	かなりうまくいきました。	text	\N	1	\N
0f1b47e5-f9ec-43cd-9ff2-e82be3776788	313bcea6-a78e-4a19-be7e-45dc1329a151	どうだ	text	\N	1	\N
3ffc6b95-8805-4976-a4c1-f350934fdc64	7ff9ccc3-7b22-4c1e-8915-e632bd44fa22	リアルタイムテスト	text	\N	1	\N
71634776-ac61-4219-a738-d103f2b3c694	b6c7d27b-ee07-4b2a-911d-7857de5ab2c1	リアルタイムかな	text	\N	1	\N
82c507f6-c11f-4054-ba9f-143078b402b5	4fb66f4e-f008-46fb-a1ce-a4d9652783f5	テストメッセージをおくってます。	text	\N	1	\N
adf3bac3-25ab-48f7-bd5a-61f693d4cf86	988ac25d-b867-4a6b-9fd4-bb5d7293574a	こんにちは。	text	\N	1	\N
e5097b4b-5518-4f42-b9d7-f3b6da2e91a6	8844c1e2-8dd5-4a54-b3d5-25c8ce6525a8	テストのメッセージを送っています。	text	\N	1	\N
ee31cb14-88cf-4feb-a01d-3b8309bffc38	e071002d-2819-4215-b6d6-22882b5a6566	テストメッセージを更新します。	text	\N	1	\N
86007db6-e696-438f-8c02-497135698d3c	09777cd2-5a18-4ae7-b92b-d5ea8ca6f232	送信	text	\N	1	\N
c403351f-6028-4a0d-981e-cce0945a1661	f6a7da70-c0f8-4c8a-816a-01878849d811	今の時刻は2024/7/7 17:35です。	text	\N	1	\N
5e5fde9b-a9f4-4066-9018-1d4b34ce17ea	4f911b1c-6695-418b-82cb-f2e3cce1f15f	既読のテスト中です。	text	\N	1	\N
575d5c06-5e85-411d-b691-b610200ae998	56210a76-55ab-4bbf-a907-d46cb082cac6	送信の挙動テスト	text	\N	1	\N
d513fad0-183b-4bfa-95a9-e9ab8cdb44b0	1464f097-cda1-4427-bfc7-5bae47f45ee0	めっせーーーーじ！	text	\N	1	\N
f65936be-264e-426f-8c0a-10201fb82474	60e67650-ce00-4439-ae18-45abca54f377	スクロール確認！！	text	\N	1	\N
632ef40c-d51f-4e4c-8619-0463db718734	035b3c5b-d579-469a-8624-ceeb2353b412	今日はここまで！	text	\N	1	\N
973ec271-d17f-465d-abc0-2e8f5d45e9d6	6303798c-d703-4da7-888d-c45314eadd1e		image	d1465d54-1b79-4bb6-88d7-6f95ef85e54d	1	\N
9d168913-5360-46dc-b3c0-e5feb3837fa2	9877070f-0456-4d1a-b9b6-5c600ba13b86		image	aacaa18a-94ef-4543-ade6-544a0e1eeeb1	1	\N
c86286fa-ce6c-422a-8d15-c52ac2f0baff	150ca86e-980a-4e5f-a9b3-84028731afb9		image	4964b7a1-80ae-49dc-8bb9-abb95c4fa1f8	1	\N
d21557a0-bc97-4f69-b408-350b32e1117d	962f798f-cae0-440b-9e2f-b54ad71109b0		image	22f3182b-03a3-48a9-a31a-7e0926e44801	1	\N
246f8fe3-8b23-471c-a909-ce82cbedfc33	910bed47-8cf8-4be1-bb1b-a69e4cbf8f6f		image	418d0b03-bf08-4bce-8ab5-e7104dba16ea	1	\N
50a59efd-3b3d-4916-a0d7-8c17cbaa37c3	0fd59bda-c5e9-4da5-bc15-bd40597bb318	画像が表示できるようになったぜ	text	\N	1	\N
494011bf-87b3-40b8-b2e6-15c8ce71765d	c8861d0a-1e8b-4204-a061-99c31e5c91cb	\N	announce_hold	\N	\N	1cb42f82-3c42-4aec-a3b2-84cb3c45872e
913fdec9-79e9-4137-9ba5-a198f233f980	ccfb92a2-8fe8-46db-9413-768f6ec0dbb9	\N	announce_hold	\N	\N	1cb42f82-3c42-4aec-a3b2-84cb3c45872e
7b9599dc-02e1-4b56-8a16-aee3ab90cebd	3fde2e0d-ee5f-4923-9386-f49d99c8ee8e	仮押さえ申請時にメッセージが送れるようになりました。	text	\N	1	\N
22580f5b-f6fa-41a0-8cd3-40062729b8cc	1d4690d4-e7f8-49a4-85fe-29be410b0c33		image	d5414bce-0eda-45bb-b645-76221ccf0b27	1	\N
8f3434c0-1f2c-4a24-b0d4-3c952504cfa5	7c7fb29e-afe2-414a-a6a0-3d47b7ea3693	チャット即更新テスト	text	\N	1	\N
69cae672-6595-46e6-9364-3f4538d25f6a	e785f22a-e4ed-4dac-b131-0b7a5aeb9103		image	eebdba0d-a83d-4cf0-a9a7-783d29837cd0	1	\N
1d94baa7-aedd-4591-a4b3-6cd060a34e65	825e8b4f-26df-4d62-b74f-569f641b763b		image	2720d7d0-b250-4e07-be93-a782d4a427c7	1	\N
53be2490-7254-4fa6-b87d-cba943f421fd	9da02c9d-fac6-431b-877f-d1886dade1e6		image	ed38aaea-5765-4ceb-9879-adf88656ae2f	1	\N
e83508d9-2135-40a1-b480-b139e2022ce9	6ecf69c5-5541-4c45-9a95-41234b2ebf3c		image	60952d87-24e2-426b-b0f0-2b2693d065ea	1	\N
2fd5dbcb-e945-4393-9995-9cdfb9c57e5c	a458e509-9904-4873-ba7b-243e75667662		image	3e792fcf-9472-414f-8855-81c1de440c2e	1	\N
698e3a0a-9d26-401e-888c-3e133644f7e6	772a4f2a-51b5-4592-8d9e-0a56bbf83efc		image	781509b5-348c-44ec-918b-4712321c3516	1	\N
d170737d-9936-43d5-ade5-af361bf2b2be	a7ae3c46-9ea7-4b65-b317-22ac8a03bde1		image	4d1a3989-fea0-4a60-9ad2-d79348a73dfd	1	\N
e0df37bc-cbaa-474a-ba09-e33b0c52d58a	2b9542d2-400f-42c8-ae2c-b6f38236e3a0		image	3041c09b-ae23-464a-820f-52565d03b2e0	1	\N
3f60ef62-ec00-4d7b-8c2d-fde6cee10051	7592f51c-59a3-4e6a-87e4-1ba3ef19cf94		image	dca58127-b3a7-446c-a711-6a3d58c37888	1	\N
5c3db1f6-c340-4049-81d7-a01bea9c4332	bfb6ed3e-6343-402a-8831-a7b5426f3d30	テスト	text	\N	1	\N
107a0cc2-b36b-45e1-8456-8d73cae4493d	0a0ed4b8-a700-4e83-aae7-2865c75f9e42		image	e7bd4081-2e07-4a82-b7fe-2b25f924c48c	1	\N
56a3229c-3a9f-45e3-8d09-ac9e3ee3102a	598281cd-6dcf-40e7-8904-c30e343dd4a5	🙌	text	\N	1	\N
a5213139-0f43-4caa-922b-c1cfa47be948	0fff2f81-4663-4a83-8e1f-85c55bbdfd4d	https://www.youtube.com/watch?v=84kcLhMQBLU	text	\N	1	\N
494d2d63-74b9-4f20-9967-daa663597aa4	f0482ca8-dde2-4819-859e-b767f2c857c6	https://www.youtube.com/watch?v=84kcLhMQBLU　てすとりんく	text	\N	1	\N
e5bfed55-43cb-4b49-8aef-9112c7b2c50b	dd9599eb-216a-45da-8d82-d3535afcb518	テスト	text	\N	1	\N
84e610aa-7284-4ef6-bfd1-3cb10a2ef820	c8529d9b-cf78-457d-93be-ebbf34fa1128	https://www.youtube.com/watch?v=84kcLhMQBLU　てすとりんく	text	\N	1	\N
cd2446bd-cea4-46e3-8785-e37d738d766b	1ac1874d-6fec-4886-a01c-9da80a1ba803	メッセージ改行	text	\N	1	\N
47870c74-579b-4496-a805-4807b989dda1	d6a03798-18f5-457f-9017-5facced4acc9	メッセージ改行のテストを\n行っています。	text	\N	1	\N
b4c02a39-ca00-4a62-8761-37f6e64607ef	3ffe184d-5d41-42c3-9311-a849bea7723e	メッセージ改行のテストを行っています。	text	\N	1	\N
7297bfe1-075d-46f5-8fdf-9b19169b736b	4f152b2f-85c6-4876-9f6a-b0b8707709d4	メッセージ\n改行の\nテストを\n行って\nいます。\nうまく表示ができているか\n見ています。	text	\N	1	\N
ed06ec84-6903-454b-94e7-76987fefefde	86c41e81-b34e-4346-8ce6-74690ce28ea5	メッセージを\n入力するときに\n改行がうまくできる仕組みを\n完璧に構築できた\n気がします。	text	\N	1	\N
d29bfb25-b799-41dc-b697-a19c49c1cf5f	48b88209-8862-43cd-b1d2-26013693a0fe	既読テスト	text	\N	1	\N
70776f5c-c405-433a-ba84-6b0155c338ff	dc242058-7a5d-4e45-a7b9-b36348e788ab	既読テスト	text	\N	1	\N
7465cc4c-d2a6-439b-9411-ca5f68a089ed	6b7a2c51-f7ac-4623-a629-71a4fb3dfa33	自動既読反映できるのか！	text	\N	1	\N
09dab659-3418-4c3b-b72d-ba759a68ccf2	ada74bdf-781e-404f-a507-e6e72ba52a0f	自動既読反映できるのか！	text	\N	1	\N
e02b20dd-2eee-4edb-b287-de4f46852165	4c9ce592-9c7e-46f6-a192-56c65b633c8b	メッセージ送信	text	\N	1	\N
dff7b35b-6275-47ee-9f41-363bf41320e9	314d57e5-1f3e-4471-b057-b8689652ab97	うまくいっていないなあ	text	\N	1	\N
cbc11638-0a13-41c8-848c-8c20917807e3	69b02290-b161-47f3-b76b-3a77610a9d14	おーけーい	text	\N	1	\N
33078901-1b22-4bc2-af74-e02dd9c6431b	074ef891-7a7b-47b2-8db5-41d117687c9f	なかなかうまくいかねえな	text	\N	1	\N
dcf90400-cb56-4c5b-8072-56995d3b74a7	9661dfe8-3c03-4262-8f05-58d3835e5b0c	記録ロジック作成中	text	\N	1	\N
e8135ff3-17cf-430d-877c-60d8f7d7702f	6f2841a9-e98e-484a-9378-3d6047e2eb5f	既読ロジック作成中２	text	\N	1	\N
554857f7-fb72-4761-9237-01966f529bbf	6683244f-9705-4296-8bcf-fb0bd1b14a99	メッセージ送信ロジックの修正中	text	\N	1	\N
2ab41475-bde1-457b-b00b-22d1b35d4d63	eebe07c7-6290-4a04-9380-4c64a6c8d9cf	ニュー送信ロジック	text	\N	1	\N
51f851e6-62cf-4ff2-a433-d28d6749f4ae	207553ae-1cc4-4d39-bacb-bcfba5464a40	メッセージ送信テスト	text	\N	1	\N
5bf9dee6-e0f7-467c-8e6d-9e6319423033	ea23d71a-f91e-428a-a407-25d5a827ac4f	送信テスト	text	\N	1	\N
0475eac9-2d29-4253-a00d-9c4396e69748	e58c94e2-fa67-4e42-9ecf-27a27e930cd5	うまくいきますか	text	\N	1	\N
6fbcba31-4d69-49b1-a6b8-1e67e44e8881	36535f1d-361e-4d7e-8d34-696ec98d0b35	メッセージ送信テスト管理者側	text	\N	1	\N
f9ab1229-028d-4426-a764-8ccbbd70940f	d7c6d0af-bdea-4caa-8a4c-6cbf6c86105e	リアルタイム既読反映がうまくいかないな	text	\N	1	\N
de6ac274-4d93-4e49-bb49-d1904b8ff8fa	40da9186-2edd-40f0-85c9-8b7b3d2807f2	メッセージ送信しただけで既読	text	\N	1	\N
160ecd90-7f87-47af-9b63-a7427297d867	90727458-4005-4f35-9979-35d59d9c24ff	管理者からアーティストへメッセージ送信テスト	text	\N	1	\N
cd7c9434-1e26-4844-9b54-534ab3dd9033	9a03cff3-bd45-4dd6-98bb-47cd07ffeaa1	メッセージ送信	text	\N	1	\N
e82a0710-6469-409a-916e-b858e4007400	8d94bbff-f020-42ac-81c7-3b96c0dcc45e	メッセージ	text	\N	1	\N
c1e6908c-4b94-4879-a18d-dc15aabc01af	32783ecf-1605-4860-ad77-e35046042ca9	送信	text	\N	1	\N
dc058aaa-61ff-45ce-b385-3670dd17d5eb	11ac4348-5772-4a21-9f42-c5bf112594d2	メッセージを送信した時に勝手にスクロールしないかテスト	text	\N	1	\N
c647a52a-9cd9-4eeb-ac9f-8d892c2bd084	b9e0e00d-1b6b-4c96-a966-2738dcce4d53	メッセージ送信	text	\N	1	\N
9de7cf06-c342-4553-8be9-4261de186c18	2a320b6c-d3db-4caf-a320-affd6b70c15a	送信テスト	text	\N	1	\N
efb65b2b-aa11-4557-afd9-e8d293620745	ba6b225f-9186-4ca3-ae9e-8e745bc85272	既読テスト	text	\N	1	\N
bddbd093-3101-4fc8-8673-0e6e432992fa	485b2a7b-511d-4f38-888c-82669415f74c	既読テスト	text	\N	1	\N
cd99944b-c159-4ce0-8ce4-9f117273d9cf	16e0b352-9e95-424a-a262-5ae9e614cd95	既読テスト２	text	\N	1	\N
e8d323f1-d4bb-4503-8673-07c478424b13	d1e67649-232a-4648-bc77-357d1f276bb5	既読テスト３	text	\N	1	\N
9c581a06-ed0c-4ecd-92c3-9e399ca8aacc	05f8ae33-2ec4-44d2-8e0c-4444da586cbb	既読テスト	text	\N	1	\N
5729fda2-35e1-43cf-a32c-dfcbae71f1bc	ca48a0b1-8de9-4fa0-9b71-25fa6f29fa72	即時既読テスト	text	\N	1	\N
32095c50-3c3e-4a63-93a9-b94d63fcd307	8855c80c-c943-470f-a9a2-54a7493321b2	即時既読テスト	text	\N	1	\N
723f0a6c-5ea5-4f2a-930d-f4194ca07ae1	bd18bc2d-2adb-4b27-9315-21ce43070273	即時既読テスト	text	\N	1	\N
ecc3321f-5daa-4810-964b-02ceeedee281	8776a446-e2e1-4de9-aa12-8470d25570d3	即時既読テスト	text	\N	1	\N
e8d272ce-8f41-44a7-9a3a-507fb66bf09b	91ca9a6b-ff84-4507-aa18-51ecc1d08706	うまくいった気がする	text	\N	1	\N
bfa9675b-20f6-4ca2-b3b3-1e6fc7b67fb3	174deb29-9ff5-4bd0-86ac-2425e7566af7	新規メッセージの送信ロジック高速化	text	\N	1	\N
43dc942c-b04e-4581-9d30-fc9fb565e1ad	05391fdc-3f83-4cad-a858-f1deebb3c65a	新規メッセージの送信ロジックの高速化	text	\N	1	\N
41399f24-1ba8-40ff-b579-f0625e7ec154	ac9b7b0c-3ee0-4dd9-8a54-4a42e0101f01	新規メッセージの送信ロジックテスト	text	\N	1	\N
dc500588-fae5-42de-8211-04f0b6815462	aea2376b-a306-4502-9c3c-32a883cf33a6	改行はどう\nですか	text	\N	1	\N
cbd2100b-14e5-4860-aefc-ce680e6fa9d2	d0709761-1943-481b-8fbd-9a07283a5786		image	f31e82a0-378a-4683-a339-9b9703efd2fb	1	\N
826d19a1-2944-420a-bedf-ddd42295ea77	eef29a4b-fc5b-4bc0-a4ff-4832f35d3f2c		image	989ac479-7c91-4ecf-9a55-4049d8ab83c3	1	\N
1282ff5d-303e-4c74-8ed0-2be2b4e8e748	bfc45244-e92a-4bfd-a41f-ab7c19d1c34a	\N	announce_hold	\N	\N	76273afb-6e4c-4863-a650-26a9fa173e82
b23e8bac-767f-4a1d-a478-ca5e9d129e22	c843adbd-3c28-4505-8002-bc15d02dad3e	新規メッセージ送信	text	\N	1	\N
6b290b9f-4d7c-4a53-892e-1393b133be9d	27433422-d942-4527-9164-2ea6549dff68	新規メッセージの送信ロジック	text	\N	1	\N
4e992267-b9e0-4b9e-a920-eda4b87fb04d	c01c6ada-613c-4347-abe0-7cc8ecbc6d77	自動スクロール\nするかな	text	\N	1	\N
35ea37e8-55c0-413a-b2f3-05b2fe7ab1b3	e5e397aa-1d4e-4381-bd24-cbe1c97db56b	しないかな	text	\N	1	\N
33e0a385-3469-453e-9884-cb732d2f868a	08ee6372-70ec-41c8-b6be-7b4d2989f8a4	メッセージ送信ロジック	text	\N	1	\N
f8ab18f2-d8fd-447f-952d-5bd144556c82	fc692db8-6879-4b00-84af-612f3107b851	メッセージ	text	\N	1	\N
dc8243e5-a90a-4b4b-99a7-8663420e6703	6117e3f4-1bdc-4c49-a581-cf2d29698791	メッセージ送信	text	\N	1	\N
61c66cd0-dcae-4b62-9849-3e33dc194a4b	4b59537d-480a-421c-b09d-4e4d720e57a9		image	5e073ca1-6c19-49ab-8a0c-6bc43f0ba640	1	\N
ae8bf80d-1964-4c5c-845f-0842cdc239a7	6174242f-c8d2-4bb8-943f-0e8d068078c3	新規メッセージ	text	\N	1	\N
96ef9484-7344-4000-b352-d473322e37d7	f69c7eb4-4764-4bf7-931a-2864d6478f4e	送信	text	\N	1	\N
5ae08e9a-ad81-40dc-9698-9f48a80e597e	05c6a1c6-80d1-4595-a110-6a13c7a28c70	送信テスト	text	\N	1	\N
ad6a4fde-5ad6-47f7-bf62-59a450f3a95c	5ed616ad-b08b-430f-8ade-edda290c964d	送信	text	\N	1	\N
695ea163-93d3-420a-90b1-1a1180515205	28c2847b-62f9-4432-a4b4-6998a989e079	そーうしん！	text	\N	1	\N
\.


--
-- Data for Name: admin_nickname_permissions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.admin_nickname_permissions (id, admin_user_id, artist_id) FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.admin_users (id, username, password, role, full_name, "position", nickname, email, profile_picture) FROM stdin;
2	testgeneral	$2a$10$F.0Xzdjk6/KKfeJc3Stu4uP1TR3mhc8f.XSbCyxf7HZMFuTszYIma	general					
1	testadmin	$2a$10$Oy1x1sf0VeR8kuQqRvn4MeylnPk/xPlPFz9NXVLaYI4NZTloIcLfO	admin	稲垣悠一郎	代表取締役	ガッキー	inagaki@tacticart.co.jp	profile_1_1720067577900.jpg
\.


--
-- Data for Name: artist_group_relations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.artist_group_relations (artist_id, group_id) FROM stdin;
895b2760-600e-4ae8-9a00-467bc8a51408	2
5785268a-10bb-4ae9-9e93-ef6447ce4638	2
ef0bbdea-6331-4d72-ba93-3faa98e159c6	2
3eb1d63f-6dfc-4629-8623-1f4b830b1eb5	2
c7b99584-d021-43b3-8371-8fdd05b6eff0	2
173d0d1c-6a6c-4c7e-8519-1808af1da989	2
7480a130-0dc1-4186-8d87-4535ee0a2e00	2
f75fd665-fae7-4887-a74d-f9e532202bc1	2
ad059c6c-c640-4ce9-9c8a-ebf66fc32697	2
1127c809-9fe2-45cd-a09b-4b0406c0a077	2
fbcb3bbd-cc09-4f26-a83d-a0660ee9fc84	2
4276c614-1385-4716-a7da-53b20f2b09d2	2
12b710ad-c43a-418a-b677-e5aa0e50b8b4	2
9be21a38-82bf-4d11-a9e4-9f3919f44cae	2
567fc4f2-30ae-4ef3-b918-4fb2ca17eeb5	2
53eafdd2-ff0e-46ae-a513-6e6b00ceafe5	2
0f6aa2e5-47d6-42c0-810b-31bf0b90a0e7	2
bada8fe8-7d83-4cc6-b643-a2c18871adf8	2
e71bb22f-7aed-4347-9f74-5acb1b806969	2
c255ba26-c649-48bf-95b0-c2c452db4e48	2
fe2dc866-5bfd-42d3-a319-640bea3600f7	2
c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	1
895b2760-600e-4ae8-9a00-467bc8a51408	1
d4515171-06aa-4c02-9787-ef383eaf0273	1
0a6edb67-dbd3-4a72-a672-36d03fab94c2	1
32c40002-5455-48a9-a9c3-c15a9c2c8310	1
b8231818-931d-40c0-9c90-e51b56e70b0b	1
12b710ad-c43a-418a-b677-e5aa0e50b8b4	1
c255ba26-c649-48bf-95b0-c2c452db4e48	1
\.


--
-- Data for Name: artist_groups; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.artist_groups (group_id, group_name, description) FROM stdin;
2	テストオーケストラメンバー	\N
1	ヴァイオリングループ1	\N
4	テストグループ2	\N
\.


--
-- Data for Name: artist_hold_casting; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.artist_hold_casting (id, event_uuid, fee, message, created_at, updated_at) FROM stdin;
1cb42f82-3c42-4aec-a3b2-84cb3c45872e	e543d859-eeb5-4a27-b4d9-362b2c2b3697	\N	日程の確認をお願いします。	2024-07-08 15:27:46.425242	2024-07-08 15:27:46.425242
76273afb-6e4c-4863-a650-26a9fa173e82	f00c32d7-8e83-4482-8e03-00fd492020f3	\N	出演者のキャスティング中です。日程の確保が可能な場合、仮押さえオファーを承認してください。	2024-07-10 13:41:58.410676	2024-07-10 13:41:58.410676
\.


--
-- Data for Name: artist_messages; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.artist_messages (id, message_id, content, message_format, image_id) FROM stdin;
9693a5ec-3f58-4530-b56f-a4544c7aa0c9	277a6906-e55a-4051-b6b6-de35aa39f6bd	アーティスト側のメッセージ送信テストです	text	\N
f38dc570-795e-4cbb-95f2-4fbf91d626af	dedfabfa-0754-4bfa-9ae1-684c9e3d2d94	ついに来た	text	\N
09bf6708-bf63-4d67-850f-2444b1fbc6fb	ca973fec-ad7b-42a5-b08e-e71cceeb4043	どや	text	\N
358a2d8d-c1b8-4529-9364-5aa4a9f0c6a1	1741a305-0760-458c-a334-41f104f99978	Alt＋Enterで送信できるかな	text	\N
bb6b7251-420d-4e47-8341-3dc947dfc63e	9366b26d-0bbe-413b-b058-10310e117184	メッセージ送信	text	\N
a92a882e-4a37-417a-b92b-2b22c55893a7	87adb636-0378-4fec-ab36-9873bb77b29d	メッセージ送信テストアーティスト側	text	\N
2aa8defe-7736-4500-b2ed-c9c262ed54e9	28ce6ec0-448c-4f12-9f1f-7585dfd1f658	メッセージ送信	text	\N
d65164e0-b644-43f6-95ed-0cb0374db006	d121313a-62f2-42b7-b314-5681e2d2729d	アーティストから管理者へメッセージ送信テスト	text	\N
271c2cfe-f41e-48ec-ab88-1f6dd0e75156	4734b45c-4926-4133-b32c-2ac5b45db1d6	メッセージを送信	text	\N
668b68e3-9e6b-4e21-9285-449940bd5e5b	6831230d-6981-4a66-8d44-c69cb9061a4a	送信	text	\N
8f7686a7-5cf4-45d4-ad3a-44520cb08b38	c03141b1-9b33-4d32-b70f-c51a349d76c6	自動既読反映テスト	text	\N
7a298461-bcfe-4df3-a323-48993b797b47	b56ac275-ffe8-4b80-9162-1b0d6c4e9cb5	自動既読反映テストリバイバル	text	\N
1bd76baa-f1dd-4c94-85b1-490e75d269b0	8c6351ac-ed42-4e52-b21d-294fe273dfa9	メッセージ送信した時に勝手にスクロールしないかテスト	text	\N
5f17c489-3c9a-4d40-8793-8846f17398e5	4e111115-afa1-45eb-afbb-9110cc305191	送信テスト	text	\N
037d46bf-be74-440c-8a34-85f01b18929e	7001fd6c-d164-4abe-917b-ccbc8eada43e	即時既読テスト	text	\N
7124455a-b03e-47ba-89ca-0cb58ca1d5a7	a75547f0-af22-4fad-bfcc-fc856489e427	うまくいったかな	text	\N
18a29a5b-7549-4fa6-a740-3991179afb69	83b1b480-e30c-40d4-938c-a3294accdea2	改行メッセージのテスト	text	\N
6f9c7b25-f1cc-40f9-8f73-0143b969e404	7765a65d-9edd-481f-97df-840e640bd949	改行メッセージのテスト\n\nを行っています。	text	\N
00ef5987-d176-4351-a671-f92b021d05ab	9b7c9869-de49-4104-8350-791880fb58ac		image	311d629c-eee5-40a7-8c24-0278a1227499
5fc1f0b9-d676-4ac0-9f16-0da259751ce6	0eb41704-4bf9-4690-9415-6cf483412488		image	73021e77-8043-4d2a-ba6b-a8072f666afc
cb57017b-7751-47f8-96ea-2cac61788abb	d3e02e22-b240-44f4-a345-df7d0ba6b4f2		image	90f3f399-0525-4ca3-8596-dca66d58cfd5
503701b8-815e-414a-bc01-b1c584d2dc87	263a3b03-5319-41ce-86ca-954d2b047082	送信ロジック	text	\N
17737583-4a1c-4f25-bafc-ef792249711d	34de4948-575e-4f29-8786-53082180de46	どうだ	text	\N
5aa73489-6e16-4bea-a56b-046441c0ca40	e9dce8a9-696a-4c79-92b5-0f520da053c4	送信	text	\N
3910099e-cf49-4b53-9b07-f3417d1043c3	cd56554b-4e0e-4952-a310-5d298d79524d	そーうしん！	text	\N
a6bc64fc-fa68-4265-b65c-9c4c0c96e8fa	61443e0b-7682-4a54-86a8-d49a9c00c0d0	送信テスト	text	\N
f5d62e6e-d4cf-4eb8-8ec3-2af3059d45ab	f3cee2c8-c712-41b5-be99-e20fa04abf40		image	416cd8f0-b879-43a4-8285-ecb55128295f
670df424-12d3-4f1a-8805-f40c0c55ddac	42d7ec4b-2ef2-4adf-94aa-932326d011c4	メール	text	\N
\.


--
-- Data for Name: artists; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.artists (artist_id, name, parts, email, password, admin_note, profile_picture, gender, company_name, phone_number, twitter_url, instagram_url, facebook_url, hp_url, bio, notes, youtube_url, birth_year, birth_month, birth_day, last_message_time) FROM stdin;
ef0bbdea-6331-4d72-ba93-3faa98e159c6	高橋 一郎	{saxophone}	高橋一郎@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c7b99584-d021-43b3-8371-8fdd05b6eff0	伊藤 健太	{horn}	伊藤健太@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f75fd665-fae7-4887-a74d-f9e532202bc1	中村 玲子	{oboe}	中村玲子@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ad059c6c-c640-4ce9-9c8a-ebf66fc32697	小林 直樹	{tenor}	小林直樹@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d4515171-06aa-4c02-9787-ef383eaf0273	山口 恵美	{violin}	山口恵美@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fd9e08ab-c997-426b-934a-44aabff4e27c	松本 拓也	{bass}	松本拓也@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b9707355-dd33-4aae-83f9-e84e7c195214	林 美紀	{keyboard}	林美紀@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e9484eb3-7a6f-4df3-8201-ca7bdb2190dc	山崎 翔	{alto}	山崎翔@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eacad04f-0b8c-4352-8d60-9f1b2788d80c	中島 大地	{tuba}	中島大地@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
af934cce-6b6d-4374-9c50-aa6bf3c43b9f	前田 舞	{cello}	前田舞@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99c6586d-78b7-48cd-a1e0-4b0a4022bcbb	藤田 直子	{percussion}	藤田直子@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b4a26b8d-d2dc-48cf-befc-68bf9e468a6f	岡田 勇人	{bass}	岡田勇人@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1127c809-9fe2-45cd-a09b-4b0406c0a077	加藤 彩	{bass_guitar}	加藤彩@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c40e329-ae5a-4c8f-ba96-38c80ab923cf	岡本 雅	{bass_guitar}	岡本雅@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2114f304-fd1a-46cb-887a-600ede4e7624	木村 大輔	{trombone}	木村大輔@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2f6d7403-ad20-4e8d-9633-7a9e57b31b18	近藤 亮介	{alto}	近藤亮介@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31633070-53e2-42c6-9023-9a7b4cbf4290	千野哲太	{saxophone}	\N	\N	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43e5dfc2-fb0e-4b66-81f6-73fa4d99c966	吉田 翔太	{double_bass}	吉田翔太@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
445e9525-4baf-42a5-8c02-cf5c4d439f5a	斎藤 剛	{bassoon}	斎藤剛@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
46495296-11a3-4875-a103-0d48b6e60ebb	佐藤 太郎	{saxophone}	佐藤太郎@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
49b17df3-d904-4e12-8e40-24d82aa08dcf	長谷川 優太	{drum_set}	長谷川優太@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57c51e0c-c5f5-48d5-b9c9-1045df426c9a	三浦 洋介	{organ}	三浦洋介@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
65e83614-91b3-4339-9551-db0830e45804	佐々木 龍太	{trombone}	佐々木龍太@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6a6e96ab-39fb-4fdd-8630-7de62681953c	小川 拓海	{harpsichord}	小川拓海@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
73b9392e-0843-4ba9-b6cc-2c5d423ca25b	テスト	{flute,oboe}	\N	\N	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7480a130-0dc1-4186-8d87-4535ee0a2e00	山本 和也	{bass_guitar}	山本和也@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
791da725-57c8-4d90-9cc4-0f40d311fdc0	長文の名前のケースをテストしています	{trombone}	\N	\N	メモの\nテスト\nです。	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7b7bb807-3e45-4055-a5f7-dae8fa7b05fd	池田 亮	{trombone}	池田亮@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f1e00cd8-a1bf-4ef1-99d1-3d2d88ce5c33	森 祐介	{piano}	森祐介@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2024-07-08 15:27:46.425242
a1aac01a-3ce3-4a8c-84bf-bd19b180d361	福田 直美	{harp}	福田直美@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fbcb3bbd-cc09-4f26-a83d-a0660ee9fc84	西村 裕也	{bass_guitar}	西村裕也@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b67c3c32-c2a7-4adf-aec6-4b118d3474e5	高橋 アリス	{tuba}	高橋アリス@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e7e9fb39-1f33-4b7e-ad99-f154cbe154bf	渡辺 ロバート	{bassoon}	渡辺ロバート@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ced36e68-04f2-4911-9268-2d43a2f0abfa	山本 ケイト	{timpani}	山本ケイト@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aac55df4-6cb6-4269-abf9-2f285d9e4bde	加藤 ルーカス	{alto}	加藤ルーカス@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e61220d5-d21b-4746-a081-d74463bf3144	佐々木 メアリー	{baritone}	佐々木メアリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d299edac-72a7-4e58-8725-efee6f614272	山口 アレックス	{harp}	山口アレックス@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a6d2f142-b4bf-443f-b6dd-1df269cdfd4b	木村 トーマス	{tenor}	木村トーマス@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bdd37830-de59-4513-8d8c-cbbed93c96d9	林 サラ	{tuba}	林サラ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b8231818-931d-40c0-9c90-e51b56e70b0b	阿部 オリビア	{violin}	阿部オリビア@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9be21a38-82bf-4d11-a9e4-9f3919f44cae	山崎 クリス	{harp}	山崎クリス@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a9e11dce-c7ce-41d4-a597-0dd16b15b109	中島 ノア	{cello}	中島ノア@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cd552879-d112-4248-8899-92c90948be8a	前田 キャシー	{baritone}	前田キャシー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
081917b6-beab-48d0-bcd7-7160e66764fa	小野 大樹	{harp}	小野大樹@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13dfd2e9-0aff-4d2b-adb7-e8aaa9b8d96c	池田 ジョージ	{mezzo_soprano}	池田ジョージ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1ffecb67-8b17-4d0b-a8a1-fb41bd95ccf0	田中 ジョン	{harpsichord}	田中ジョン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30abd03e-47b2-42b5-a017-74ee16d71b08	山田 リチャード	{tuba}	山田リチャード@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32c40002-5455-48a9-a9c3-c15a9c2c8310	竹内 俊介	{violin}	竹内俊介@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33a00e4f-bb9c-41a7-881c-469164ef2f9c	小川 マシュー	{cello}	小川マシュー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37edcff0-7370-4fcc-910c-d313c7b08025	斉藤 エリック	{horn}	斉藤エリック@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
58c2493a-4feb-43d8-8c2e-2e08823a1ee1	森 ケビン	{timpani}	森ケビン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5b3c6da3-5e54-4b24-b23d-2bec5de38a43	中野 健	{trombone}	中野健@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5ea04f1c-3d0d-4a31-a83c-86146ae35930	岡田 ジェームズ	{clarinet}	岡田ジェームズ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
868875ad-5f71-4de6-a591-2cf42aec360a	中村 デイビッド	{percussion}	中村デイビッド@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
90a02502-6a66-4ea1-928b-4073b78d0bb6	鈴木 マイク	{soprano}	鈴木マイク@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95ce4c00-4d86-4ea7-a1db-6b889df4b26a	中川 颯太	{saxophone}	中川颯太@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99b2b532-2c62-4340-8b36-8c22ccab0930	近藤 ジャスティン	{flute}	近藤ジャスティン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bada8fe8-7d83-4cc6-b643-a2c18871adf8	青木 ベンジャミン	{percussion}	青木ベンジャミン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cdbcd679-ab52-40f5-aa94-836c6abc36af	西田 エヴァン	{alto}	西田エヴァン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e71bb22f-7aed-4347-9f74-5acb1b806969	福島 メリッサ	{saxophone}	福島メリッサ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c255ba26-c649-48bf-95b0-c2c452db4e48	杉山 ジェイソン	{violin}	杉山ジェイソン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fe2dc866-5bfd-42d3-a319-640bea3600f7	佐野 ニコール	{horn}	佐野ニコール@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c0e19632-eae3-4cc9-b73f-566066c5711f	大塚 ヘンリー	{harpsichord}	大塚ヘンリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
00f59ef1-3ae4-4968-854a-cb20777c3f54	安倍 グレース	{bass_guitar}	安倍グレース@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2e2637ee-f685-4507-930c-41d732b7fa61	岡本 サラ	{electric_guitar}	岡本サラ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4358917f-4919-4a86-9322-429b045bac01	村上 ヴィクトリア	{trumpet}	村上ヴィクトリア@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
53eafdd2-ff0e-46ae-a513-6e6b00ceafe5	後藤 エイミー	{alto}	後藤エイミー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c468b00a-5c59-4390-8f3b-ad245d62c31d	大野 エミリー	{bass}	大野エミリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0c87f325-da87-47bc-b9ea-b5970b43e76c	福田 マーク	{flute}	福田マーク@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f571010-b3f6-43d1-b2b7-64afbdd8a662	藤井 オードリー	{viola}	藤井オードリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f6aa2e5-47d6-42c0-810b-31bf0b90a0e7	三浦 ハリー	{harp}	三浦ハリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
560ef9ff-362b-4c12-b990-2238f2331558	長谷川 イーサン	{bass}	長谷川イーサン@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
567fc4f2-30ae-4ef3-b918-4fb2ca17eeb5	西村 アンディ	{piano}	西村アンディ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
824dcb7f-05dc-4d65-978b-1c5984505de4	村田 イザベラ	{bass}	村田イザベラ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1ed28ac4-9f28-4c6c-9d8f-96ffc17a3454	山田 麻美	{mezzo_soprano}	山田麻美@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1fd7bfe5-cf11-425d-9d4f-d14f74b06f32	藤田 レベッカ	{piano}	藤田レベッカ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24fb628a-f850-495f-b2a2-6e1bc0bf8ed3	清水 リリー	{trombone}	清水リリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c4b6100-abe4-4489-9479-eabc7b390434	橋本 志保	{oboe}	橋本志保@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2db4bed6-888f-4ba4-ae0e-5d947ef86a98	石田 知美	{trumpet}	石田知美@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3e016379-91e8-476f-880e-0b959712b6a0	吉田 アンナ	{piano}	吉田アンナ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3eb1d63f-6dfc-4629-8623-1f4b830b1eb5	田中 美咲	{viola}	田中美咲@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
412cedf1-ed3d-4646-9678-3a455049e21c	井上 クレア	{double_bass}	井上クレア@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4276c614-1385-4716-a7da-53b20f2b09d2	佐藤 エミリー	{harp}	佐藤エミリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5785268a-10bb-4ae9-9e93-ef6447ce4638	鈴木 花子	{bassoon}	鈴木花子@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
04e11402-244d-477d-aef2-4e2be6349085	石井 レイチェル	{acoustic_guitar}	石井レイチェル@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a6edb67-dbd3-4a72-a672-36d03fab94c2	松田 奈々	{violin}	松田奈々@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0fad4b36-f04f-44b4-ae9a-169f68fe4f89	伊藤 ジェシカ	{timpani}	伊藤ジェシカ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12b710ad-c43a-418a-b677-e5aa0e50b8b4	橋本 エリカ	{violin}	橋本エリカ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16d5633b-2f5f-41d8-a845-fcfdf0f17c8c	石田 ミランダ	{timpani}	石田ミランダ@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
173d0d1c-6a6c-4c7e-8519-1808af1da989	渡辺 愛	{bass_guitar}	渡辺愛@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c604fa0-fb8a-48a2-a376-b76972edf1fe	藤井 和香	{double_bass}	藤井和香@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
594e6c71-a3f6-459c-a677-0c45692c44ee	松本 ナタリー	{harp}	松本ナタリー@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5c33b7a8-30af-4171-a8c4-958e6c26c822	石井 里奈	{acoustic_guitar}	石井里奈@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5d8e1620-0d48-47aa-b73c-4220db91c8a7	小林 ソフィア	{double_bass}	小林ソフィア@test.com	$2a$10$JCyoocAIzhKnbrLvz6EbsuaZuqY0tb3ISqRYwu2guAS4NEWTayQCa	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
616ceb95-d839-4dee-9787-43b4da4ab14a	清水 真由	{organ}	清水真由@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6e2a226b-f4a6-4d6f-9aab-1c799114772f	村上 咲	{soprano}	村上咲@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
78187cea-7029-472e-b50f-e6924c366c88	金子 理香	{harp}	金子理香@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7efc67b7-0f8a-4b50-9895-9a761400557d	田村 菜々子	{mezzo_soprano}	田村菜々子@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83c8b0ce-4001-4975-8e66-95ea0e25a6b1	石川 由美	{harpsichord}	石川由美@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
895b2760-600e-4ae8-9a00-467bc8a51408	高松亜衣	{violin}	\N	\N		\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
918c785a-4091-45d8-bb38-ebfcbea3a389	後藤 美奈	{organ}	後藤美奈@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95677f95-761f-400c-a8cc-495bd2582de1	阿部 優子	{keyboard}	阿部優子@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
975ab2b1-f0c9-492b-b16b-712e78ae3abe	井上 佳奈	{oboe}	井上佳奈@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c935c220-48f9-4077-a1ab-23711aaeebc1	原田 恵	{soprano}	原田恵@test.com	$2a$10$sHT.zWuC1oW316HTgY3cEucFnZuMRvanUStPQrQII/AIYivwHNqb6	\N	\N	female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	稲垣悠一郎	{violin}	yuichiroinagaki@test.com	$2a$10$bJso9e/NCzbOoFv0DtdE0u/R1OZBAy7WWmAyRMZccHIrgU9J5iDSi	\N	profile_c3de3cf2-f1bc-4fe2-8d07-88fc564b3666_1720154711225.jpg	male	タクティカート	\N	https://twitter.com/tacticart_ceo	https://www.instagram.com/tacticart_ceo/	https://www.facebook.com/yuichiro.inagaki.524	https://www.tacticart.co.jp/	Tacticart,inc. 芸術を戦略的に。		https://www.youtube.com/@tacticart_inc	1993	4	7	2024-07-11 12:59:55.458677
\.


--
-- Data for Name: event_casting_info; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.event_casting_info (id, event_uuid, part, number, memo, sort_order, sent_contract_count, signed_contract_count) FROM stdin;
24	f00c32d7-8e83-4482-8e03-00fd492020f3	1st　ヴァイオリン	6		1	0	0
25	f00c32d7-8e83-4482-8e03-00fd492020f3	2nd　ヴァイオリン	4		2	0	0
26	f00c32d7-8e83-4482-8e03-00fd492020f3	ヴィオラ	6		3	0	0
27	f00c32d7-8e83-4482-8e03-00fd492020f3	コントラバス	4		4	0	0
28	f00c32d7-8e83-4482-8e03-00fd492020f3	チェロ	5		5	0	0
29	f00c32d7-8e83-4482-8e03-00fd492020f3	クラリネット	2		6	0	0
34	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	1st ヴァイオリン	5		1	0	0
35	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	2nd ヴァイオリン	5		2	0	0
36	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ヴィオラ	4		3	0	0
37	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	チェロ	4		4	0	0
38	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	コントラバス	3		5	0	0
39	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	フルート	2		6	0	0
40	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	オーボエ	2		7	0	0
41	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	クラリネット	2		8	0	0
42	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ファゴット	2		9	0	0
43	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ホルン	4		10	0	0
44	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	トランペット	3		11	0	0
45	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	トロンボーン	4		12	0	0
46	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	チューバ	3		13	0	0
47	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ティンパニ	1		14	0	0
48	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	打楽器	2		15	0	0
49	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ハープ	1		16	0	0
50	df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	ピアノ	1		17	0	0
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.events (event_uuid, name, genre, event_date, open_time, start_time, organizer, operator, flyer_front_url, flyer_back_url, performance_type, venue, performance_flag, original_event_uuid, use_existing_flyers) FROM stdin;
df57e40d-08d1-4a04-9f61-4c4bfcbeca7b	テスト	orchestra	\N	\N	\N	Tacticart	Tacticart	\N	\N	\N	\N	first	\N	f
e543d859-eeb5-4a27-b4d9-362b2c2b3697	テスト単発公演	solo	2024-07-16	15:44:00	15:44:00	Tacticart	Tacticart	\N	\N	\N	テスト公会堂	single	\N	f
e2422df7-81f3-4c56-aa5f-01cae1063e08	テスト初回公演	wind	2024-06-30	18:00:00	19:00:00	Tacticart	Tacticart	1718538341936.jpg	\N	Day1	テスト野外ステージ	first	\N	f
f00c32d7-8e83-4482-8e03-00fd492020f3	秋の音楽会	orchestra	2024-10-15	13:30:00	14:00:00	Tacticart	Tacticart	1718590608750.jpg	\N	\N	\N	first	\N	f
47081b4c-9233-40dd-b3f5-209ebaf1747e	テスト初回公演	wind	2024-07-01	18:00:00	19:00:00	Tacticart	Tacticart	\N	\N	Day2	テスト野外ステージ	additional	e2422df7-81f3-4c56-aa5f-01cae1063e08	t
630d6dc6-f05d-4d44-9df7-782b40fc91a2	秋の音楽会	orchestra	2024-10-15	18:30:00	19:00:00	Tacticart	Tacticart	\N	\N	夜公演	null	additional	f00c32d7-8e83-4482-8e03-00fd492020f3	t
ce6a8c35-f352-49d5-81d3-a7b3d59da36e	テスト初回公演	wind	2024-07-02	18:00:00	19:00:00	Tacticart	Tacticart	\N	\N	Day3	テスト野外ステージ	additional	e2422df7-81f3-4c56-aa5f-01cae1063e08	t
\.


--
-- Data for Name: genres; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.genres (id, label, value) FROM stdin;
1	オーケストラ	orchestra
2	吹奏楽	wind
3	ソロ	solo
4	カルテット	quartet
5	フェス	festival
\.


--
-- Data for Name: hold_casting_artists; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.hold_casting_artists (id, hold_casting_id, artist_id, status) FROM stdin;
e35e8cda-cdef-4d3c-aecc-3d8874d2257a	1cb42f82-3c42-4aec-a3b2-84cb3c45872e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	pending
bcfbddbf-0249-4a0b-b727-6888bb0bf392	1cb42f82-3c42-4aec-a3b2-84cb3c45872e	f1e00cd8-a1bf-4ef1-99d1-3d2d88ce5c33	pending
af73a053-f0bc-468b-b263-aeae0e6a57b3	76273afb-6e4c-4863-a650-26a9fa173e82	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	pending
\.


--
-- Data for Name: hold_dates; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.hold_dates (id, hold_casting_id, hold_date, note, created_at, updated_at) FROM stdin;
dcc098ca-b493-49fd-8855-5abea7f0e241	1cb42f82-3c42-4aec-a3b2-84cb3c45872e	2024-07-15	本番日	2024-07-08 15:27:46.425242	2024-07-08 15:27:46.425242
9a3ce561-f197-45b6-892b-c5eb9868d2b0	76273afb-6e4c-4863-a650-26a9fa173e82	2024-10-15	本番日	2024-07-10 13:41:58.410676	2024-07-10 13:41:58.410676
\.


--
-- Data for Name: hold_notifications; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.hold_notifications (id, message_id, hold_casting_id) FROM stdin;
\.


--
-- Data for Name: message_images; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.message_images (id, file_name, created_at, expires_at) FROM stdin;
d1465d54-1b79-4bb6-88d7-6f95ef85e54d	d1465d54-1b79-4bb6-88d7-6f95ef85e54d.JPG	2024-07-08 11:51:56.114301	2024-07-15 11:51:56.114301
aacaa18a-94ef-4543-ade6-544a0e1eeeb1	aacaa18a-94ef-4543-ade6-544a0e1eeeb1.JPG	2024-07-08 11:57:31.639418	2024-07-15 11:57:31.639418
4964b7a1-80ae-49dc-8bb9-abb95c4fa1f8	4964b7a1-80ae-49dc-8bb9-abb95c4fa1f8.JPG	2024-07-08 12:08:31.313878	2024-07-15 12:08:31.313878
22f3182b-03a3-48a9-a31a-7e0926e44801	22f3182b-03a3-48a9-a31a-7e0926e44801.JPG	2024-07-08 12:58:24.417685	2024-07-15 12:58:24.417685
418d0b03-bf08-4bce-8ab5-e7104dba16ea	418d0b03-bf08-4bce-8ab5-e7104dba16ea.JPG	2024-07-08 13:01:00.282493	2024-07-15 13:01:00.282493
d5414bce-0eda-45bb-b645-76221ccf0b27	d5414bce-0eda-45bb-b645-76221ccf0b27.jpg	2024-07-08 21:56:49.878381	2024-07-15 21:56:49.878381
eebdba0d-a83d-4cf0-a9a7-783d29837cd0	eebdba0d-a83d-4cf0-a9a7-783d29837cd0.jpg	2024-07-08 22:04:12.759829	2024-07-15 22:04:12.759829
2720d7d0-b250-4e07-be93-a782d4a427c7	2720d7d0-b250-4e07-be93-a782d4a427c7.jpg	2024-07-09 10:12:16.363655	2024-07-16 10:12:16.363655
ed38aaea-5765-4ceb-9879-adf88656ae2f	ed38aaea-5765-4ceb-9879-adf88656ae2f.jpg	2024-07-09 10:14:14.992844	2024-07-16 10:14:14.992844
60952d87-24e2-426b-b0f0-2b2693d065ea	60952d87-24e2-426b-b0f0-2b2693d065ea.jpg	2024-07-09 10:21:04.836852	2024-07-16 10:21:04.836852
3e792fcf-9472-414f-8855-81c1de440c2e	3e792fcf-9472-414f-8855-81c1de440c2e.jpg	2024-07-09 10:33:28.812908	2024-07-16 10:33:28.812908
781509b5-348c-44ec-918b-4712321c3516	781509b5-348c-44ec-918b-4712321c3516.jpg	2024-07-09 10:36:29.997805	2024-07-16 10:36:29.997805
4d1a3989-fea0-4a60-9ad2-d79348a73dfd	4d1a3989-fea0-4a60-9ad2-d79348a73dfd.jpg	2024-07-09 10:41:24.661159	2024-07-16 10:41:24.661159
3041c09b-ae23-464a-820f-52565d03b2e0	3041c09b-ae23-464a-820f-52565d03b2e0.jpg	2024-07-09 10:45:03.562796	2024-07-16 10:45:03.562796
dca58127-b3a7-446c-a711-6a3d58c37888	dca58127-b3a7-446c-a711-6a3d58c37888.jpg	2024-07-09 10:45:24.269077	2024-07-16 10:45:24.269077
e7bd4081-2e07-4a82-b7fe-2b25f924c48c	e7bd4081-2e07-4a82-b7fe-2b25f924c48c.jpg	2024-07-09 10:53:18.5298	2024-07-16 10:53:18.5298
f31e82a0-378a-4683-a339-9b9703efd2fb	f31e82a0-378a-4683-a339-9b9703efd2fb.jpg	2024-07-10 13:20:36.726262	2024-07-17 13:20:36.726262
311d629c-eee5-40a7-8c24-0278a1227499	311d629c-eee5-40a7-8c24-0278a1227499.jpg	2024-07-10 13:22:24.351828	2024-07-17 13:22:24.351828
73021e77-8043-4d2a-ba6b-a8072f666afc	73021e77-8043-4d2a-ba6b-a8072f666afc.jpg	2024-07-10 13:25:23.222151	2024-07-17 13:25:23.222151
989ac479-7c91-4ecf-9a55-4049d8ab83c3	989ac479-7c91-4ecf-9a55-4049d8ab83c3.jpg	2024-07-10 13:26:28.487748	2024-07-17 13:26:28.487748
90f3f399-0525-4ca3-8596-dca66d58cfd5	90f3f399-0525-4ca3-8596-dca66d58cfd5.png	2024-07-10 13:26:59.733665	2024-07-17 13:26:59.733665
5e073ca1-6c19-49ab-8a0c-6bc43f0ba640	5e073ca1-6c19-49ab-8a0c-6bc43f0ba640.jpg	2024-07-10 17:21:40.639514	2024-07-17 17:21:40.639514
416cd8f0-b879-43a4-8285-ecb55128295f	416cd8f0-b879-43a4-8285-ecb55128295f.jpg	2024-07-11 12:58:32.222955	2024-07-18 12:58:32.222955
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.messages (id, artist_id, message_type, created_at, is_read) FROM stdin;
f6a7da70-c0f8-4c8a-816a-01878849d811	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 17:35:37.299683	t
09777cd2-5a18-4ae7-b92b-d5ea8ca6f232	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 14:24:56.857239	t
b6c7d27b-ee07-4b2a-911d-7857de5ab2c1	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 10:29:49.61075	t
313bcea6-a78e-4a19-be7e-45dc1329a151	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 10:23:38.193632	t
7ff9ccc3-7b22-4c1e-8915-e632bd44fa22	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 10:20:35.062461	t
988ac25d-b867-4a6b-9fd4-bb5d7293574a	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 10:14:09.221991	t
4fb66f4e-f008-46fb-a1ce-a4d9652783f5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 10:01:52.589842	t
e071002d-2819-4215-b6d6-22882b5a6566	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 09:50:58.53815	t
8844c1e2-8dd5-4a54-b3d5-25c8ce6525a8	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 09:33:29.596109	t
40da9186-2edd-40f0-85c9-8b7b3d2807f2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 10:57:20.334292	t
90727458-4005-4f35-9979-35d59d9c24ff	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:04:16.055211	t
9a03cff3-bd45-4dd6-98bb-47cd07ffeaa1	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:09:54.045307	t
c8861d0a-1e8b-4204-a061-99c31e5c91cb	f1e00cd8-a1bf-4ef1-99d1-3d2d88ce5c33	admin_message	2024-07-08 15:27:46.425242	f
277a6906-e55a-4051-b6b6-de35aa39f6bd	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 16:55:12.270435	t
8d94bbff-f020-42ac-81c7-3b96c0dcc45e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:22:02.083982	t
6831230d-6981-4a66-8d44-c69cb9061a4a	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:22:35.231225	t
c03141b1-9b33-4d32-b70f-c51a349d76c6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:25:23.626299	t
b56ac275-ffe8-4b80-9162-1b0d6c4e9cb5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:35:40.552544	t
11ac4348-5772-4a21-9f42-c5bf112594d2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:37:13.400408	t
2a320b6c-d3db-4caf-a320-affd6b70c15a	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:39:30.658284	t
ba6b225f-9186-4ca3-ae9e-8e745bc85272	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:41:00.322006	t
16e0b352-9e95-424a-a262-5ae9e614cd95	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:48:03.293987	t
d1e67649-232a-4648-bc77-357d1f276bb5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:48:07.249385	t
ca48a0b1-8de9-4fa0-9b71-25fa6f29fa72	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:53:55.174941	t
bd18bc2d-2adb-4b27-9315-21ce43070273	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:54:22.479039	t
8776a446-e2e1-4de9-aa12-8470d25570d3	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:02:02.486162	t
7001fd6c-d164-4abe-917b-ccbc8eada43e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 12:03:10.309166	t
174deb29-9ff5-4bd0-86ac-2425e7566af7	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:10:03.080987	t
ac9b7b0c-3ee0-4dd9-8a54-4a42e0101f01	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:15:26.428166	t
83b1b480-e30c-40d4-938c-a3294accdea2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 13:12:47.301801	t
7765a65d-9edd-481f-97df-840e640bd949	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 13:12:55.780023	t
dedfabfa-0754-4bfa-9ae1-684c9e3d2d94	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 17:29:54.984828	t
4f911b1c-6695-418b-82cb-f2e3cce1f15f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 20:43:27.989268	t
56210a76-55ab-4bbf-a907-d46cb082cac6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 20:47:51.068192	t
1464f097-cda1-4427-bfc7-5bae47f45ee0	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 20:50:44.083971	t
60e67650-ce00-4439-ae18-45abca54f377	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 21:05:00.043363	t
035b3c5b-d579-469a-8624-ceeb2353b412	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-07 22:15:32.720988	t
6303798c-d703-4da7-888d-c45314eadd1e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 11:51:56.119353	t
9877070f-0456-4d1a-b9b6-5c600ba13b86	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 11:57:31.644427	t
150ca86e-980a-4e5f-a9b3-84028731afb9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 12:08:31.318512	t
962f798f-cae0-440b-9e2f-b54ad71109b0	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 12:58:24.43167	t
910bed47-8cf8-4be1-bb1b-a69e4cbf8f6f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 13:01:00.28712	t
0fd59bda-c5e9-4da5-bc15-bd40597bb318	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 13:03:15.925537	t
91da4d67-f366-4490-baf0-3de32840b48e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 17:08:52.433881	t
ca973fec-ad7b-42a5-b08e-e71cceeb4043	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 17:37:11.058419	t
1741a305-0760-458c-a334-41f104f99978	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 19:45:22.792856	t
d0709761-1943-481b-8fbd-9a07283a5786	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 13:20:36.734324	t
0eb41704-4bf9-4690-9415-6cf483412488	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 13:25:23.231444	t
d3e02e22-b240-44f4-a345-df7d0ba6b4f2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 13:26:59.739313	t
bfc45244-e92a-4bfd-a41f-ab7c19d1c34a	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 13:41:58.410676	t
c843adbd-3c28-4505-8002-bc15d02dad3e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:08:52.098318	t
c01c6ada-613c-4347-abe0-7cc8ecbc6d77	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:12:57.792677	t
08ee6372-70ec-41c8-b6be-7b4d2989f8a4	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:15:50.438223	t
fc692db8-6879-4b00-84af-612f3107b851	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:18:03.535625	t
6117e3f4-1bdc-4c49-a581-cf2d29698791	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:21:32.844169	t
4b59537d-480a-421c-b09d-4e4d720e57a9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:21:40.643239	t
6174242f-c8d2-4bb8-943f-0e8d068078c3	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 18:12:56.058407	t
34de4948-575e-4f29-8786-53082180de46	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 18:13:50.700488	t
f69c7eb4-4764-4bf7-931a-2864d6478f4e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 18:14:52.056845	t
e9dce8a9-696a-4c79-92b5-0f520da053c4	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 18:58:02.601546	t
05c6a1c6-80d1-4595-a110-6a13c7a28c70	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 18:58:08.486248	t
cd56554b-4e0e-4952-a310-5d298d79524d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 21:27:41.742749	t
61443e0b-7682-4a54-86a8-d49a9c00c0d0	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-11 12:57:58.332916	t
42d7ec4b-2ef2-4adf-94aa-932326d011c4	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-11 12:59:55.451503	t
ccfb92a2-8fe8-46db-9413-768f6ec0dbb9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 15:27:46.425242	t
3fde2e0d-ee5f-4923-9386-f49d99c8ee8e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 16:07:04.93686	t
1d4690d4-e7f8-49a4-85fe-29be410b0c33	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 21:56:49.884575	t
7c7fb29e-afe2-414a-a6a0-3d47b7ea3693	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 22:03:03.76313	t
e785f22a-e4ed-4dac-b131-0b7a5aeb9103	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-08 22:04:12.76467	t
825e8b4f-26df-4d62-b74f-569f641b763b	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:12:16.368656	t
9da02c9d-fac6-431b-877f-d1886dade1e6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:14:14.997744	t
6ecf69c5-5541-4c45-9a95-41234b2ebf3c	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:21:04.84164	t
a458e509-9904-4873-ba7b-243e75667662	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:33:28.818585	t
772a4f2a-51b5-4592-8d9e-0a56bbf83efc	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:36:30.003189	t
a7ae3c46-9ea7-4b65-b317-22ac8a03bde1	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:41:24.666441	t
2b9542d2-400f-42c8-ae2c-b6f38236e3a0	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:45:03.567204	t
7592f51c-59a3-4e6a-87e4-1ba3ef19cf94	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:45:24.272737	t
bfb6ed3e-6343-402a-8831-a7b5426f3d30	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:53:13.909556	t
0a0ed4b8-a700-4e83-aae7-2865c75f9e42	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:53:18.534861	t
598281cd-6dcf-40e7-8904-c30e343dd4a5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 10:54:28.572839	t
0fff2f81-4663-4a83-8e1f-85c55bbdfd4d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:20:56.031012	t
f0482ca8-dde2-4819-859e-b767f2c857c6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:29:28.464702	t
dd9599eb-216a-45da-8d82-d3535afcb518	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:29:59.618935	t
c8529d9b-cf78-457d-93be-ebbf34fa1128	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:30:08.424929	t
1ac1874d-6fec-4886-a01c-9da80a1ba803	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:37:20.784069	t
d6a03798-18f5-457f-9017-5facced4acc9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:37:37.273279	t
3ffe184d-5d41-42c3-9311-a849bea7723e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:49:36.524753	t
4f152b2f-85c6-4876-9f6a-b0b8707709d4	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 13:54:00.996507	t
86c41e81-b34e-4346-8ce6-74690ce28ea5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 14:01:50.247378	t
d6f9f29b-0702-4c8b-b230-db5b8e6f840d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 14:02:24.2508	t
ce8710f0-02a9-4f47-8840-0e7f0b5efce9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 14:03:04.215632	t
28a30616-efef-448c-b421-bdd46482f3e2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 16:58:50.192795	t
83173fe6-660d-4cc7-b5c6-b3929600a156	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 17:01:14.695271	t
450e8654-b55b-45e9-ba71-d62e058e7e74	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 17:08:28.156197	t
f8f1e52e-c2a4-413b-866a-2fdc4e0bc1bf	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 17:37:24.929693	t
ef11e9bd-c2e0-4c8b-9f6d-a265a5f3f739	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 19:45:10.025322	t
48b88209-8862-43cd-b1d2-26013693a0fe	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:04:39.171657	t
dc242058-7a5d-4e45-a7b9-b36348e788ab	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:11:10.640124	t
6b7a2c51-f7ac-4623-a629-71a4fb3dfa33	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:15:09.040277	t
ada74bdf-781e-404f-a507-e6e72ba52a0f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:16:17.097587	t
4c9ce592-9c7e-46f6-a192-56c65b633c8b	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:16:52.37876	t
314d57e5-1f3e-4471-b057-b8689652ab97	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:19:32.890756	t
69b02290-b161-47f3-b76b-3a77610a9d14	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:33:22.556817	t
074ef891-7a7b-47b2-8db5-41d117687c9f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:40:34.171197	t
9661dfe8-3c03-4262-8f05-58d3835e5b0c	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:56:59.083594	t
6f2841a9-e98e-484a-9378-3d6047e2eb5f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 21:57:27.847317	t
6683244f-9705-4296-8bcf-fb0bd1b14a99	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 22:08:10.946015	t
eebe07c7-6290-4a04-9380-4c64a6c8d9cf	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-09 22:17:40.783055	t
207553ae-1cc4-4d39-bacb-bcfba5464a40	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 09:59:08.748356	t
ea23d71a-f91e-428a-a407-25d5a827ac4f	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 09:59:47.963632	t
e58c94e2-fa67-4e42-9ecf-27a27e930cd5	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 10:09:46.139226	t
9366b26d-0bbe-413b-b058-10310e117184	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-09 21:10:45.402435	t
87adb636-0378-4fec-ab36-9873bb77b29d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 10:32:41.788793	t
28ce6ec0-448c-4f12-9f1f-7585dfd1f658	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 10:50:46.48774	t
36535f1d-361e-4d7e-8d34-696ec98d0b35	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 10:33:21.734669	t
d7c6d0af-bdea-4caa-8a4c-6cbf6c86105e	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 10:49:36.848997	t
d121313a-62f2-42b7-b314-5681e2d2729d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:05:51.736656	t
4734b45c-4926-4133-b32c-2ac5b45db1d6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:10:50.402063	t
32783ecf-1605-4860-ad77-e35046042ca9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:22:19.44573	t
8c6351ac-ed42-4e52-b21d-294fe273dfa9	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:36:50.693253	t
b9e0e00d-1b6b-4c96-a966-2738dcce4d53	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:38:08.241817	t
4e111115-afa1-45eb-afbb-9110cc305191	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 11:39:36.215052	t
485b2a7b-511d-4f38-888c-82669415f74c	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:48:00.291332	t
05f8ae33-2ec4-44d2-8e0c-4444da586cbb	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:48:18.822269	t
8855c80c-c943-470f-a9a2-54a7493321b2	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 11:54:05.566678	t
91ca9a6b-ff84-4507-aa18-51ecc1d08706	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:02:22.531576	t
a75547f0-af22-4fad-bfcc-fc856489e427	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 12:03:22.626218	t
05391fdc-3f83-4cad-a858-f1deebb3c65a	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:10:24.114957	t
aea2376b-a306-4502-9c3c-32a883cf33a6	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 12:15:40.432121	t
9b7c9869-de49-4104-8350-791880fb58ac	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 13:22:24.355681	t
eef29a4b-fc5b-4bc0-a4ff-4832f35d3f2c	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 13:26:28.493593	t
27433422-d942-4527-9164-2ea6549dff68	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:09:07.186328	t
e5e397aa-1d4e-4381-bd24-cbe1c97db56b	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 17:13:12.306437	t
263a3b03-5319-41ce-86ca-954d2b047082	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-10 18:13:42.206497	t
5ed616ad-b08b-430f-8ade-edda290c964d	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 18:58:14.400968	t
28c2847b-62f9-4432-a4b4-6998a989e079	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	admin_message	2024-07-10 21:27:54.043163	t
f3cee2c8-c712-41b5-be99-e20fa04abf40	c3de3cf2-f1bc-4fe2-8d07-88fc564b3666	artist_message	2024-07-11 12:58:32.227061	t
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.parts (id, label, value, sort_order, deletable, short_name) FROM stdin;
1	ヴァイオリン	violin	1	f	Vn
3	チェロ	cello	3	t	Vc
4	コントラバス	double_bass	4	t	Cb
5	フルート	flute	5	f	Fl
6	オーボエ	oboe	6	f	Ob
7	クラリネット	clarinet	7	t	Cl
8	サックス	saxophone	8	f	Sax
9	ファゴット	bassoon	9	t	Fg
10	ホルン	horn	10	t	Hn
11	トランペット	trumpet	11	t	Tp
12	トロンボーン	trombone	12	t	Tb
13	チューバ	tuba	13	t	Tu
14	ハープ	harp	14	t	Hp
15	ピアノ	piano	15	t	Pf
16	チェンバロ	harpsichord	16	t	Cemb
17	オルガン	organ	17	t	Org
18	ティンパニ	timpani	18	t	Timp
19	パーカッション	percussion	19	t	Perc
20	ソプラノ	soprano	20	t	Sop
21	メゾソプラノ	mezzo_soprano	21	t	Mez
22	アルト	alto	22	t	Alt
23	テノール	tenor	23	t	Ten
24	バリトン	baritone	24	t	Bar
25	バス	bass	25	t	Bs
26	エレキギター	electric_guitar	26	t	EG
2	ヴィオラ	viola	2	t	Va
27	アコースティックギター	acoustic_guitar	27	t	AG
28	ベースギター	bass_guitar	28	t	BG
29	ドラムセット	drum_set	29	t	Dr
30	キーボード	keyboard	31	t	Key
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 2, true);


--
-- Name: artist_groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.artist_groups_group_id_seq', 4, true);


--
-- Name: event_casting_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.event_casting_info_id_seq', 50, true);


--
-- Name: genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.genres_id_seq', 5, true);


--
-- Name: parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.parts_id_seq', 31, true);


--
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


--
-- Name: admin_nickname_permissions admin_nickname_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_nickname_permissions
    ADD CONSTRAINT admin_nickname_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: artist_group_relations artist_group_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_group_relations
    ADD CONSTRAINT artist_group_relations_pkey PRIMARY KEY (artist_id, group_id);


--
-- Name: artist_groups artist_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_groups
    ADD CONSTRAINT artist_groups_pkey PRIMARY KEY (group_id);


--
-- Name: artist_hold_casting artist_hold_casting_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_hold_casting
    ADD CONSTRAINT artist_hold_casting_pkey PRIMARY KEY (id);


--
-- Name: artist_messages artist_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_messages
    ADD CONSTRAINT artist_messages_pkey PRIMARY KEY (id);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (artist_id);


--
-- Name: event_casting_info event_casting_info_event_uuid_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.event_casting_info
    ADD CONSTRAINT event_casting_info_event_uuid_sort_order_key UNIQUE (event_uuid, sort_order);


--
-- Name: event_casting_info event_casting_info_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.event_casting_info
    ADD CONSTRAINT event_casting_info_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_uuid);


--
-- Name: genres genres_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (id);


--
-- Name: genres genres_value_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_value_key UNIQUE (value);


--
-- Name: hold_casting_artists hold_casting_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_casting_artists
    ADD CONSTRAINT hold_casting_artists_pkey PRIMARY KEY (id);


--
-- Name: hold_dates hold_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_dates
    ADD CONSTRAINT hold_dates_pkey PRIMARY KEY (id);


--
-- Name: hold_notifications hold_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_notifications
    ADD CONSTRAINT hold_notifications_pkey PRIMARY KEY (id);


--
-- Name: message_images message_images_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.message_images
    ADD CONSTRAINT message_images_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: parts parts_value_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_value_key UNIQUE (value);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: idx_event_casting_event_uuid; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_event_casting_event_uuid ON public.event_casting_info USING btree (event_uuid);


--
-- Name: idx_sessions_expire; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);


--
-- Name: admin_messages admin_messages_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- Name: admin_messages admin_messages_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: admin_nickname_permissions admin_nickname_permissions_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_nickname_permissions
    ADD CONSTRAINT admin_nickname_permissions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id);


--
-- Name: admin_nickname_permissions admin_nickname_permissions_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin_nickname_permissions
    ADD CONSTRAINT admin_nickname_permissions_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(artist_id);


--
-- Name: artist_group_relations artist_group_relations_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_group_relations
    ADD CONSTRAINT artist_group_relations_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(artist_id) ON DELETE CASCADE;


--
-- Name: artist_group_relations artist_group_relations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_group_relations
    ADD CONSTRAINT artist_group_relations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.artist_groups(group_id) ON DELETE CASCADE;


--
-- Name: artist_hold_casting artist_hold_casting_event_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_hold_casting
    ADD CONSTRAINT artist_hold_casting_event_uuid_fkey FOREIGN KEY (event_uuid) REFERENCES public.events(event_uuid);


--
-- Name: artist_messages artist_messages_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.artist_messages
    ADD CONSTRAINT artist_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: event_casting_info event_casting_info_event_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.event_casting_info
    ADD CONSTRAINT event_casting_info_event_uuid_fkey FOREIGN KEY (event_uuid) REFERENCES public.events(event_uuid) ON DELETE CASCADE;


--
-- Name: events events_original_event_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_original_event_uuid_fkey FOREIGN KEY (original_event_uuid) REFERENCES public.events(event_uuid);


--
-- Name: hold_casting_artists hold_casting_artists_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_casting_artists
    ADD CONSTRAINT hold_casting_artists_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(artist_id);


--
-- Name: hold_casting_artists hold_casting_artists_hold_casting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_casting_artists
    ADD CONSTRAINT hold_casting_artists_hold_casting_id_fkey FOREIGN KEY (hold_casting_id) REFERENCES public.artist_hold_casting(id);


--
-- Name: hold_dates hold_dates_hold_casting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_dates
    ADD CONSTRAINT hold_dates_hold_casting_id_fkey FOREIGN KEY (hold_casting_id) REFERENCES public.artist_hold_casting(id);


--
-- Name: hold_notifications hold_notifications_hold_casting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_notifications
    ADD CONSTRAINT hold_notifications_hold_casting_id_fkey FOREIGN KEY (hold_casting_id) REFERENCES public.artist_hold_casting(id) ON DELETE CASCADE;


--
-- Name: hold_notifications hold_notifications_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.hold_notifications
    ADD CONSTRAINT hold_notifications_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


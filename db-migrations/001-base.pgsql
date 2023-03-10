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
-- Name: budgetzen_user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_user_sessions (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    expires_at timestamp with time zone NOT NULL,
    verified BOOLEAN NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.budgetzen_user_sessions OWNER TO postgres;


--
-- Name: budgetzen_verification_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_verification_codes (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    verification jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.budgetzen_verification_codes OWNER TO postgres;


--
-- Name: budgetzen_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_budgets (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    month character varying NOT NULL,
    value text NOT NULL,
    extra jsonb NOT NULL
);


ALTER TABLE public.budgetzen_budgets OWNER TO postgres;


--
-- Name: budgetzen_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_expenses (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    cost text NOT NULL,
    description text NOT NULL,
    budget text NOT NULL,
    date character varying NOT NULL,
    is_recurring BOOLEAN NOT NULL,
    extra jsonb NOT NULL
);


ALTER TABLE public.budgetzen_expenses OWNER TO postgres;


--
-- Name: budgetzen_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_users (
    id uuid DEFAULT gen_random_uuid(),
    email character varying NOT NULL,
    encrypted_key_pair text NOT NULL,
    subscription jsonb NOT NULL,
    status character varying NOT NULL,
    extra jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.budgetzen_users OWNER TO postgres;


--
-- Name: budgetzen_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgetzen_migrations (
    id uuid DEFAULT gen_random_uuid(),
    name character varying(100) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.budgetzen_migrations OWNER TO postgres;


--
-- Name: budgetzen_user_sessions budgetzen_user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_user_sessions
    ADD CONSTRAINT budgetzen_user_sessions_pkey PRIMARY KEY (id);


--
-- Name: budgetzen_verification_codes budgetzen_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_verification_codes
    ADD CONSTRAINT budgetzen_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: budgetzen_budgets budgetzen_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_budgets
    ADD CONSTRAINT budgetzen_budgets_pkey PRIMARY KEY (id);


--
-- Name: budgetzen_expenses budgetzen_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_expenses
    ADD CONSTRAINT budgetzen_expenses_pkey PRIMARY KEY (id);
    

--
-- Name: budgetzen_users budgetzen_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_users
    ADD CONSTRAINT budgetzen_users_pkey PRIMARY KEY (id);


--
-- Name: budgetzen_user_sessions budgetzen_user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_user_sessions
    ADD CONSTRAINT budgetzen_user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


--
-- Name: budgetzen_verification_codes budgetzen_verification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_verification_codes
    ADD CONSTRAINT budgetzen_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


--
-- Name: budgetzen_budgets budgetzen_budgets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_budgets
    ADD CONSTRAINT budgetzen_budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


--
-- Name: budgetzen_expenses budgetzen_expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgetzen_expenses
    ADD CONSTRAINT budgetzen_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


--
-- Name: TABLE budgetzen_user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budgetzen_user_sessions TO postgres;


--
-- Name: TABLE budgetzen_verification_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budgetzen_verification_codes TO postgres;


--
-- Name: TABLE budgetzen_budgets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budgetzen_budgets TO postgres;


--
-- Name: TABLE budgetzen_expenses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budgetzen_expenses TO postgres;


--
-- Name: TABLE budgetzen_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budgetzen_users TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;

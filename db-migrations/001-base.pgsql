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

CREATE TABLE public.budgetzen_users (
    id uuid DEFAULT gen_random_uuid(),
    email character varying NOT NULL,
    encrypted_key_pair text NOT NULL,
    subscription jsonb NOT NULL,
    status character varying NOT NULL,
    extra jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.budgetzen_users ADD CONSTRAINT budgetzen_users_pkey PRIMARY KEY (id);


CREATE TABLE public.budgetzen_migrations (
    id uuid DEFAULT gen_random_uuid(),
    name character varying(100) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE public.budgetzen_user_sessions (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    expires_at timestamp with time zone NOT NULL,
    verified BOOLEAN NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.budgetzen_user_sessions ADD CONSTRAINT budgetzen_user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.budgetzen_user_sessions ADD CONSTRAINT budgetzen_user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


CREATE TABLE public.budgetzen_verification_codes (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    verification jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.budgetzen_verification_codes ADD CONSTRAINT budgetzen_verification_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.budgetzen_verification_codes ADD CONSTRAINT budgetzen_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


CREATE TABLE public.budgetzen_budgets (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    month character varying NOT NULL,
    value text NOT NULL,
    extra jsonb NOT NULL
);

ALTER TABLE ONLY public.budgetzen_budgets ADD CONSTRAINT budgetzen_budgets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.budgetzen_budgets ADD CONSTRAINT budgetzen_budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);


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

ALTER TABLE ONLY public.budgetzen_expenses ADD CONSTRAINT budgetzen_expenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.budgetzen_expenses ADD CONSTRAINT budgetzen_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.budgetzen_users(id);

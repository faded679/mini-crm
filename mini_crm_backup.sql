--
-- PostgreSQL database dump
--

\restrict XSUHxIEo9nHxpdsOe63xvffL9O4QDbJX70AMvuUbX3pQe7AoiZl87qOZVvc249N

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

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
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'new',
    'sent',
    'awaiting_payment',
    'paid',
    'cancelled'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: PackagingType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PackagingType" AS ENUM (
    'pallets',
    'boxes'
);


ALTER TYPE public."PackagingType" OWNER TO postgres;

--
-- Name: RateUnit; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RateUnit" AS ENUM (
    'pallet',
    'boxes'
);


ALTER TYPE public."RateUnit" OWNER TO postgres;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'new',
    'warehouse',
    'shipped',
    'done',
    'archived'
);


ALTER TYPE public."RequestStatus" OWNER TO postgres;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'new',
    'matched',
    'unmatched',
    'ignored'
);


ALTER TYPE public."TransactionStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bank_import_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_import_batches (
    id text NOT NULL,
    file_name text NOT NULL,
    period_start timestamp(3) without time zone NOT NULL,
    period_end timestamp(3) without time zone NOT NULL,
    account text NOT NULL,
    total_incoming double precision NOT NULL,
    total_outgoing double precision NOT NULL,
    open_balance double precision NOT NULL,
    close_balance double precision NOT NULL,
    record_count integer NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    imported_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bank_import_batches OWNER TO postgres;

--
-- Name: bank_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_transactions (
    id integer NOT NULL,
    document_number text NOT NULL,
    document_date timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    direction text NOT NULL,
    payer_name text NOT NULL,
    payer_inn text,
    payer_account text,
    payer_bik text,
    payer_bank text,
    recipient_name text NOT NULL,
    recipient_inn text,
    recipient_account text,
    purpose text NOT NULL,
    counterparty_id integer,
    invoice_numbers text[],
    status public."TransactionStatus" DEFAULT 'new'::public."TransactionStatus" NOT NULL,
    matched_at timestamp(3) without time zone,
    import_batch_id text NOT NULL,
    raw_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bank_transactions OWNER TO postgres;

--
-- Name: bank_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_transactions_id_seq OWNER TO postgres;

--
-- Name: bank_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_transactions_id_seq OWNED BY public.bank_transactions.id;


--
-- Name: box_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.box_types (
    id integer NOT NULL,
    name text NOT NULL,
    max_volume_m3 double precision NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    min_volume_m3 double precision DEFAULT 0 NOT NULL,
    hint text
);


ALTER TABLE public.box_types OWNER TO postgres;

--
-- Name: box_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.box_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.box_types_id_seq OWNER TO postgres;

--
-- Name: box_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.box_types_id_seq OWNED BY public.box_types.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    short_name text NOT NULL,
    full_name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: cities_fbs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities_fbs (
    id integer NOT NULL,
    short_name text NOT NULL,
    full_name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cities_fbs OWNER TO postgres;

--
-- Name: cities_fbs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cities_fbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cities_fbs_id_seq OWNER TO postgres;

--
-- Name: cities_fbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cities_fbs_id_seq OWNED BY public.cities_fbs.id;


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cities_id_seq OWNER TO postgres;

--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: client_service_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_service_prices (
    id integer NOT NULL,
    delivery_type_id integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    unit text DEFAULT 'шт'::text NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_service_prices OWNER TO postgres;

--
-- Name: client_service_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_service_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_service_prices_id_seq OWNER TO postgres;

--
-- Name: client_service_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_service_prices_id_seq OWNED BY public.client_service_prices.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    telegram_id text NOT NULL,
    username text,
    first_name text,
    last_name text,
    consent_given boolean DEFAULT false NOT NULL,
    consent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    phone text,
    email text
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: counterparties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counterparties (
    id integer NOT NULL,
    name text NOT NULL,
    inn text,
    kpp text,
    ogrn text,
    address text,
    account text,
    bik text,
    correspondent_account text,
    bank text,
    director text,
    contract text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    director_post text,
    org_status text,
    org_type text,
    short_name text
);


ALTER TABLE public.counterparties OWNER TO postgres;

--
-- Name: counterparties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.counterparties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.counterparties_id_seq OWNER TO postgres;

--
-- Name: counterparties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.counterparties_id_seq OWNED BY public.counterparties.id;


--
-- Name: counterparty_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counterparty_balances (
    id integer NOT NULL,
    counterparty_id integer NOT NULL,
    total_billed double precision DEFAULT 0 NOT NULL,
    total_paid double precision DEFAULT 0 NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.counterparty_balances OWNER TO postgres;

--
-- Name: counterparty_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.counterparty_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.counterparty_balances_id_seq OWNER TO postgres;

--
-- Name: counterparty_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.counterparty_balances_id_seq OWNED BY public.counterparty_balances.id;


--
-- Name: counterparty_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counterparty_contacts (
    id integer NOT NULL,
    counterparty_id integer NOT NULL,
    client_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.counterparty_contacts OWNER TO postgres;

--
-- Name: counterparty_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.counterparty_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.counterparty_contacts_id_seq OWNER TO postgres;

--
-- Name: counterparty_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.counterparty_contacts_id_seq OWNED BY public.counterparty_contacts.id;


--
-- Name: delivery_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_schedules (
    id integer NOT NULL,
    destination text DEFAULT ''::text NOT NULL,
    delivery_date timestamp(3) without time zone NOT NULL,
    accept_days text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    city_id integer NOT NULL
);


ALTER TABLE public.delivery_schedules OWNER TO postgres;

--
-- Name: delivery_schedules_fbs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_schedules_fbs (
    id integer NOT NULL,
    city_id integer NOT NULL,
    destination text DEFAULT ''::text NOT NULL,
    delivery_date timestamp(3) without time zone NOT NULL,
    accept_days text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.delivery_schedules_fbs OWNER TO postgres;

--
-- Name: delivery_schedules_fbs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_schedules_fbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_schedules_fbs_id_seq OWNER TO postgres;

--
-- Name: delivery_schedules_fbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_schedules_fbs_id_seq OWNED BY public.delivery_schedules_fbs.id;


--
-- Name: delivery_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_schedules_id_seq OWNER TO postgres;

--
-- Name: delivery_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_schedules_id_seq OWNED BY public.delivery_schedules.id;


--
-- Name: delivery_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_types (
    id integer NOT NULL,
    name text NOT NULL,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.delivery_types OWNER TO postgres;

--
-- Name: delivery_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_types_id_seq OWNER TO postgres;

--
-- Name: delivery_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_types_id_seq OWNED BY public.delivery_types.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description text NOT NULL,
    quantity double precision DEFAULT 1 NOT NULL,
    unit text DEFAULT 'шт'::text NOT NULL,
    price double precision NOT NULL,
    amount double precision NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoice_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_requests (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    request_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invoice_requests OWNER TO postgres;

--
-- Name: invoice_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_requests_id_seq OWNER TO postgres;

--
-- Name: invoice_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_requests_id_seq OWNED BY public.invoice_requests.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    number text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    counterparty_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    paid_at timestamp(3) without time zone,
    amount double precision DEFAULT 0 NOT NULL,
    status public."InvoiceStatus" DEFAULT 'new'::public."InvoiceStatus" NOT NULL,
    tbank_order_id text,
    tbank_payment_id text,
    tbank_payment_url text
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.managers (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.managers OWNER TO postgres;

--
-- Name: managers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.managers_id_seq OWNER TO postgres;

--
-- Name: managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.managers_id_seq OWNED BY public.managers.id;


--
-- Name: pallet_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pallet_types (
    id integer NOT NULL,
    name text NOT NULL,
    min_value integer NOT NULL,
    max_value integer,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pallet_types OWNER TO postgres;

--
-- Name: pallet_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pallet_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pallet_types_id_seq OWNER TO postgres;

--
-- Name: pallet_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pallet_types_id_seq OWNED BY public.pallet_types.id;


--
-- Name: price_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_rates (
    id integer NOT NULL,
    unit public."RateUnit" NOT NULL,
    price integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    city_id integer NOT NULL,
    box_type_id integer,
    pallet_type_id integer
);


ALTER TABLE public.price_rates OWNER TO postgres;

--
-- Name: price_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.price_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_rates_id_seq OWNER TO postgres;

--
-- Name: price_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.price_rates_id_seq OWNED BY public.price_rates.id;


--
-- Name: prices_fbs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prices_fbs (
    id integer NOT NULL,
    destination text NOT NULL,
    volume text NOT NULL,
    price text NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.prices_fbs OWNER TO postgres;

--
-- Name: prices_fbs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prices_fbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prices_fbs_id_seq OWNER TO postgres;

--
-- Name: prices_fbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prices_fbs_id_seq OWNED BY public.prices_fbs.id;


--
-- Name: request_field_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_field_history (
    id integer NOT NULL,
    request_id integer NOT NULL,
    manager_id integer NOT NULL,
    field text NOT NULL,
    old_value text,
    new_value text,
    changed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.request_field_history OWNER TO postgres;

--
-- Name: request_field_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_field_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_field_history_id_seq OWNER TO postgres;

--
-- Name: request_field_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_field_history_id_seq OWNED BY public.request_field_history.id;


--
-- Name: request_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_photos (
    id integer NOT NULL,
    request_id integer NOT NULL,
    file_id text NOT NULL,
    file_url text,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uploaded_by text NOT NULL
);


ALTER TABLE public.request_photos OWNER TO postgres;

--
-- Name: request_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_photos_id_seq OWNER TO postgres;

--
-- Name: request_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_photos_id_seq OWNED BY public.request_photos.id;


--
-- Name: request_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_services (
    id integer NOT NULL,
    request_id integer NOT NULL,
    description text NOT NULL,
    unit text DEFAULT 'шт'::text NOT NULL,
    quantity double precision DEFAULT 1 NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.request_services OWNER TO postgres;

--
-- Name: request_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_services_id_seq OWNER TO postgres;

--
-- Name: request_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_services_id_seq OWNED BY public.request_services.id;


--
-- Name: request_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_status_history (
    id integer NOT NULL,
    request_id integer NOT NULL,
    old_status public."RequestStatus" NOT NULL,
    new_status public."RequestStatus" NOT NULL,
    changed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.request_status_history OWNER TO postgres;

--
-- Name: request_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_status_history_id_seq OWNER TO postgres;

--
-- Name: request_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_status_history_id_seq OWNED BY public.request_status_history.id;


--
-- Name: service_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_prices (
    id integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    unit text DEFAULT 'услуга'::text NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_prices OWNER TO postgres;

--
-- Name: service_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_prices_id_seq OWNER TO postgres;

--
-- Name: service_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_prices_id_seq OWNED BY public.service_prices.id;


--
-- Name: shipment_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipment_requests (
    id integer NOT NULL,
    client_id integer NOT NULL,
    city text DEFAULT ''::text NOT NULL,
    delivery_date timestamp(3) without time zone NOT NULL,
    size text NOT NULL,
    weight double precision,
    box_count integer NOT NULL,
    comment text,
    status public."RequestStatus" DEFAULT 'new'::public."RequestStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    volume double precision,
    packaging_type public."PackagingType" DEFAULT 'boxes'::public."PackagingType" NOT NULL,
    city_id integer NOT NULL,
    box_type_id integer,
    is_read boolean DEFAULT false NOT NULL,
    delivery_type_id integer,
    mp_account_date timestamp(3) without time zone
);


ALTER TABLE public.shipment_requests OWNER TO postgres;

--
-- Name: shipment_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipment_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipment_requests_id_seq OWNER TO postgres;

--
-- Name: shipment_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipment_requests_id_seq OWNED BY public.shipment_requests.id;


--
-- Name: warehouse_workers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_workers (
    id integer NOT NULL,
    telegram_id text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email text,
    password text
);


ALTER TABLE public.warehouse_workers OWNER TO postgres;

--
-- Name: warehouse_workers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouse_workers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouse_workers_id_seq OWNER TO postgres;

--
-- Name: warehouse_workers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_workers_id_seq OWNED BY public.warehouse_workers.id;


--
-- Name: bank_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions ALTER COLUMN id SET DEFAULT nextval('public.bank_transactions_id_seq'::regclass);


--
-- Name: box_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.box_types ALTER COLUMN id SET DEFAULT nextval('public.box_types_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: cities_fbs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities_fbs ALTER COLUMN id SET DEFAULT nextval('public.cities_fbs_id_seq'::regclass);


--
-- Name: client_service_prices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_prices ALTER COLUMN id SET DEFAULT nextval('public.client_service_prices_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: counterparties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparties ALTER COLUMN id SET DEFAULT nextval('public.counterparties_id_seq'::regclass);


--
-- Name: counterparty_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_balances ALTER COLUMN id SET DEFAULT nextval('public.counterparty_balances_id_seq'::regclass);


--
-- Name: counterparty_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_contacts ALTER COLUMN id SET DEFAULT nextval('public.counterparty_contacts_id_seq'::regclass);


--
-- Name: delivery_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules ALTER COLUMN id SET DEFAULT nextval('public.delivery_schedules_id_seq'::regclass);


--
-- Name: delivery_schedules_fbs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules_fbs ALTER COLUMN id SET DEFAULT nextval('public.delivery_schedules_fbs_id_seq'::regclass);


--
-- Name: delivery_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_types ALTER COLUMN id SET DEFAULT nextval('public.delivery_types_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoice_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_requests ALTER COLUMN id SET DEFAULT nextval('public.invoice_requests_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: managers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers ALTER COLUMN id SET DEFAULT nextval('public.managers_id_seq'::regclass);


--
-- Name: pallet_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pallet_types ALTER COLUMN id SET DEFAULT nextval('public.pallet_types_id_seq'::regclass);


--
-- Name: price_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates ALTER COLUMN id SET DEFAULT nextval('public.price_rates_id_seq'::regclass);


--
-- Name: prices_fbs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices_fbs ALTER COLUMN id SET DEFAULT nextval('public.prices_fbs_id_seq'::regclass);


--
-- Name: request_field_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_field_history ALTER COLUMN id SET DEFAULT nextval('public.request_field_history_id_seq'::regclass);


--
-- Name: request_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_photos ALTER COLUMN id SET DEFAULT nextval('public.request_photos_id_seq'::regclass);


--
-- Name: request_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_services ALTER COLUMN id SET DEFAULT nextval('public.request_services_id_seq'::regclass);


--
-- Name: request_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_status_history ALTER COLUMN id SET DEFAULT nextval('public.request_status_history_id_seq'::regclass);


--
-- Name: service_prices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_prices ALTER COLUMN id SET DEFAULT nextval('public.service_prices_id_seq'::regclass);


--
-- Name: shipment_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests ALTER COLUMN id SET DEFAULT nextval('public.shipment_requests_id_seq'::regclass);


--
-- Name: warehouse_workers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_workers ALTER COLUMN id SET DEFAULT nextval('public.warehouse_workers_id_seq'::regclass);


--
-- Data for Name: bank_import_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_import_batches (id, file_name, period_start, period_end, account, total_incoming, total_outgoing, open_balance, close_balance, record_count, source, imported_at) FROM stdin;
952a4c18-3336-4d28-95cb-6dd41584adb1	kl_to_1c.txt	2026-03-24 16:43:19.329	2026-03-24 16:43:19.329		0	0	0	0	0	manual	2026-03-24 16:43:19.33
0cce2781-f4d9-4eeb-b64c-84ad659885d4	kl_to_1c.txt	2026-03-18 00:00:00	2026-03-18 00:00:00	40802810100002843508	56190	177784.23	269541.77	147947.54	4	manual	2026-03-24 16:47:40.767
a67dca8d-779c-447c-b159-57ac1edada05	kl_to_1c.txt	2026-03-18 00:00:00	2026-03-23 00:00:00	40802810100002843508	389690.92	608083.01	269541.77	51149.68	34	manual	2026-03-24 17:54:33.386
533a1522-a013-40f5-804b-133409a36915	kl_to_1c (1).txt	2026-03-18 00:00:00	2026-03-30 00:00:00	40802810100002843508	653365.94	865689.09	269541.77	57218.62	74	manual	2026-03-30 09:15:16.903
0aabe47d-529f-446a-a3f5-e599cb943078	kl_to_1c.txt	2026-03-30 00:00:00	2026-04-01 00:00:00	40802810100002843508	319236.39	381260.72	70953.1	8928.77	40	manual	2026-04-01 09:38:10.874
5136c727-c55e-4e0f-b94f-4ee82bd25818	kl_to_1c.txt	2026-03-30 00:00:00	2026-04-02 00:00:00	40802810100002843508	366286.39	400964.93	70953.1	36274.56	49	manual	2026-04-02 10:29:49.141
70664fdc-3a75-43c9-88f1-7fcf85f35a3c	kl_to_1c (1).txt	2026-04-01 00:00:00	2026-04-02 00:00:00	40802810100002843508	165887.16	249185.93	84268.43	969.66	32	manual	2026-04-02 19:08:01.297
af26a572-4b11-4b39-b659-6fd09177a133	kl_to_1c (2).txt	2026-04-01 00:00:00	2026-04-03 00:00:00	40802810100002843508	493373.18	316408.27	84268.43	261233.34	36	manual	2026-04-03 11:32:48.43
26c5919f-6c0a-463e-865e-54746501a3e6	kl_to_1c_ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ_40802810100002843508_02.04.2026-06.04.2026.txt	2026-04-02 00:00:00	2026-04-06 00:00:00	40802810100002843508	513884.53	407383.68	42559.97	149060.82	29	manual	2026-04-06 10:37:54.479
3cb64923-564d-4f0b-9566-ccd8333f4f1c	kl_to_1c_40802810100002843508_05.04.2026-09.04.2026 (1).txt	2026-04-05 00:00:00	2026-04-09 00:00:00	40802810100002843508	216351.51	291982.9	104096.34	28464.95	47	manual	2026-04-09 17:15:01.253
d8f450d1-b89a-44dc-9f38-14c37416b3b8	kl_to_1c_40802810100002843508_09.04.2026-13.04.2026.txt	2026-04-09 00:00:00	2026-04-13 00:00:00	40802810100002843508	212804.63	270523.43	71946.75	14227.95	44	manual	2026-04-13 07:52:27.867
\.


--
-- Data for Name: bank_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_transactions (id, document_number, document_date, amount, direction, payer_name, payer_inn, payer_account, payer_bik, payer_bank, recipient_name, recipient_inn, recipient_account, purpose, counterparty_id, invoice_numbers, status, matched_at, import_batch_id, raw_data, created_at) FROM stdin;
1	248	2026-03-18 00:00:00	1840	incoming	Индивидуальный предприниматель Долматова Елена Юрьевна	311603453896	40802810600000086458	044525068	ООО "ОЗОН Банк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	СЧ-000133 от 18 марта 2026 г. и СЧ-000110 от 16 марта 2026 г. НДС не облагается	25	{СЧ-000133,СЧ-000110}	matched	2026-03-24 16:47:40.772	0cce2781-f4d9-4eeb-b64c-84ad659885d4	{"Дата": "18.03.2026", "Номер": "248", "ОКАТО": "", "Сумма": "1840", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Долматова Елена Юрьевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Долматова Елена Юрьевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "18.03.2026", "ПлательщикБИК": "044525068", "ПлательщикИНН": "311603453896", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810600000086458", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"ОЗОН Банк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "СЧ-000133 от 18 марта 2026 г. и СЧ-000110 от 16 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810645374525068", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600000086458", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 16:47:40.773
2	113	2026-03-18 00:00:00	18850	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814181 от 13.03.26. НДС не облагается- 18850.00 руб.	73	{4136814181}	matched	2026-03-24 16:47:40.777	0cce2781-f4d9-4eeb-b64c-84ad659885d4	{"Код": "0", "Дата": "18.03.2026", "Номер": "113", "ОКАТО": "", "Сумма": "18850", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "18.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814181 от 13.03.26. НДС не облагается- 18850.00 руб.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 16:47:40.778
3	62	2026-03-18 00:00:00	31300	incoming	Индивидуальный предприниматель Максимчук Олег Викторович	312605708076	40802810908500023300	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № 4136814196 от 17 марта 2026 г. без НДС	53	{4136814196}	matched	2026-03-24 16:47:40.78	0cce2781-f4d9-4eeb-b64c-84ad659885d4	{"Дата": "18.03.2026", "Номер": "62", "ОКАТО": "", "Сумма": "31300", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "18.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312605708076", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810908500023300", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № 4136814196 от 17 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810908500023300", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 16:47:40.781
4	63	2026-03-18 00:00:00	4200	incoming	Индивидуальный предприниматель Максимчук Олег Викторович	312605708076	40802810908500023300	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000162 от 18 марта 2026 г. без НДС	53	{СЧ-000162}	matched	2026-03-24 16:47:40.785	0cce2781-f4d9-4eeb-b64c-84ad659885d4	{"Дата": "18.03.2026", "Номер": "63", "ОКАТО": "", "Сумма": "4200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "18.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312605708076", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810908500023300", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000162 от 18 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810908500023300", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 16:47:40.786
287	17	2026-04-03 00:00:00	4750	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000486 от 03 апреля 2026 г. без НДС	\N	{СЧ-000486}	unmatched	\N	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "03.04.2026", "Номер": "17", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000486 от 03 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.54
78	91	2026-03-25 00:00:00	53520	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ	312332151900	40802810600006217216	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата услуг В т.ч. НДС 0% - 0 руб	71	{}	matched	2026-03-30 09:15:17.048	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "25.03.2026", "Номер": "91", "ОКАТО": "", "Сумма": "53520", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312332151900", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600006217216", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата услуг В т.ч. НДС 0% - 0 руб", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600006217216", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.049
9	38	2026-03-19 00:00:00	840	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000161 от 18 марта 2026 года без НДС	33	{СЧ-000161}	matched	2026-03-24 17:54:33.416	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "19.03.2026", "Номер": "38", "ОКАТО": "", "Сумма": "840", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "19.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000161 от 18 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.417
10	36	2026-03-19 00:00:00	7500	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000131 от 18 марта 2026 года без НДС	33	{СЧ-000131}	matched	2026-03-24 17:54:33.419	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "19.03.2026", "Номер": "36", "ОКАТО": "", "Сумма": "7500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "19.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000131 от 18 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.42
11	37	2026-03-19 00:00:00	1040	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000156 от 18 марта 2026 года без НДС	33	{СЧ-000156}	matched	2026-03-24 17:54:33.422	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "19.03.2026", "Номер": "37", "ОКАТО": "", "Сумма": "1040", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "19.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000156 от 18 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.424
12	27	2026-03-19 00:00:00	57750	incoming	ООО "КОТОФИЛ"	2540278854	40702810509740002357	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по счету №661 т 11.03.2026, №645 от 11.02.2026, №652 от 25.02.2026 Сумма 57750-00 Без налога (НДС)	50	{661,645,652}	matched	2026-03-24 17:54:33.427	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "19.03.2026", "Номер": "27", "ОКАТО": "", "Сумма": "57750", "ВидОплаты": "01", "Плательщик": "ООО \\"КОТОФИЛ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ООО \\"КОТОФИЛ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "19.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "2540278854", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810509740002357", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по счету №661 т 11.03.2026, №645 от 11.02.2026, №652 от 25.02.2026 Сумма 57750-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810509740002357", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.428
13	155	2026-03-20 00:00:00	82500	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЕВРО СПРЕЙ"	3123460003	40702810600990002310	044525176	ПАО АКБ "Металлинвестбанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата счета 4136814155 от 10.03.2026 (Транспортные услуги).  Без НДС	29	{}	matched	2026-03-24 17:54:33.43	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "155", "ОКАТО": "", "Сумма": "82500", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525176", "ПлательщикИНН": "3123460003", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810600990002310", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"Металлинвестбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата счета 4136814155 от 10.03.2026 (Транспортные услуги).  Без НДС", "ПлательщикКорсчет": "30101810300000000176", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810600990002310", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.431
14	871466	2026-03-20 00:00:00	900	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Платеж по счету № СЧ-000129 от 18.03.26. НДС не облагается - 900.00 руб.	38	{СЧ-000129}	matched	2026-03-24 17:54:33.433	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "871466", "ОКАТО": "", "Сумма": "900", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Платеж по счету № СЧ-000129 от 18.03.26. НДС не облагается - 900.00 руб.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.434
15	48	2026-03-20 00:00:00	8330	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА	310802350773	40802810007000015206	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814202 от 20.03.26. НДС не облагается. - 8330.00 руб.	34	{4136814202}	matched	2026-03-24 17:54:33.436	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "48", "ОКАТО": "", "Сумма": "8330", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "310802350773", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810007000015206", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814202 от 20.03.26. НДС не облагается. - 8330.00 руб.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810007000015206", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.437
16	15	2026-03-20 00:00:00	1200	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ	310261068777	40802810700005941153	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814208 от 20.03.26. НДС не облагается - 1200.00 руб.	\N	{4136814208}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Код": "0", "Дата": "20.03.2026", "Номер": "15", "ОКАТО": "", "Сумма": "1200", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310261068777", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810700005941153", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814208 от 20.03.26. НДС не облагается - 1200.00 руб.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810700005941153", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.458
17	664014	2026-03-20 00:00:00	11150	incoming	Куницын Евгений Юрьевич	312118182378	40817810920166001813	042007855	ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814199 от 20.03.26. НДС не облагается - 11150.00 руб.	\N	{4136814199}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "664014", "ОКАТО": "", "Сумма": "11150", "ВидОплаты": "01", "Плательщик": "Куницын Евгений Юрьевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Куницын Евгений Юрьевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "042007855", "ПлательщикИНН": "312118182378", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810920166001813", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814199 от 20.03.26. НДС не облагается - 11150.00 руб.", "ПлательщикКорсчет": "30101810545250000855", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810920166001813", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.462
18	7	2026-03-20 00:00:00	7920	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СКУЛОВА МАРИНА ИВАНОВНА	311200725441	40802810000008388154	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814201 от 20.03.26. НДС не облагается - 7920.00 руб.	\N	{4136814201}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "7", "ОКАТО": "", "Сумма": "7920", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СКУЛОВА МАРИНА ИВАНОВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СКУЛОВА МАРИНА ИВАНОВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "311200725441", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810000008388154", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814201 от 20.03.26. НДС не облагается - 7920.00 руб.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810000008388154", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.465
19	9	2026-03-20 00:00:00	850	incoming	Борисова Ксения Олеговна	312328826815	40817810400015060324	044525068	ООО "ОЗОН Банк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814209 от 20.03.26. НДС не облагается - 850.00 руб.	\N	{4136814209}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "9", "ОКАТО": "", "Сумма": "850", "ВидОплаты": "01", "Плательщик": "Борисова Ксения Олеговна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Борисова Ксения Олеговна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525068", "ПлательщикИНН": "312328826815", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810400015060324", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"ОЗОН Банк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814209 от 20.03.26. НДС не облагается - 850.00 руб.", "ПлательщикКорсчет": "30101810645374525068", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810400015060324", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.468
20	10	2026-03-20 00:00:00	940	incoming	Борисова Ксения Олеговна	312328826815	40817810400015060324	044525068	ООО "ОЗОН Банк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814205 от 20.03.26. НДС не облагается - 940.00 руб.	\N	{4136814205}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "10", "ОКАТО": "", "Сумма": "940", "ВидОплаты": "01", "Плательщик": "Борисова Ксения Олеговна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Борисова Ксения Олеговна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525068", "ПлательщикИНН": "312328826815", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810400015060324", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"ОЗОН Банк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814205 от 20.03.26. НДС не облагается - 940.00 руб.", "ПлательщикКорсчет": "30101810645374525068", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810400015060324", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.471
21	9	2026-03-20 00:00:00	4930	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814213 от 20.03.26. НДС не облагается - 4930.00 руб.	\N	{4136814213}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "9", "ОКАТО": "", "Сумма": "4930", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814213 от 20.03.26. НДС не облагается - 4930.00 руб.", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.474
32	35	2026-03-23 00:00:00	2540	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814200 от 20 марта 2026 г., без НДС	70	{4136814200}	matched	2026-03-24 17:54:33.505	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "35", "ОКАТО": "", "Сумма": "2540", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814200 от 20 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.506
22	21	2026-03-20 00:00:00	4500	incoming	Индивидуальный предприниматель Маслова Мария Сергеевна	312338385013	40802810901500327883	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814215 от 20.03.26. НДС не облагается - 4500.00 руб.	\N	{4136814215}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "20.03.2026", "Номер": "21", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Маслова Мария Сергеевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Маслова Мария Сергеевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "20.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312338385013", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901500327883", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814215 от 20.03.26. НДС не облагается - 4500.00 руб.", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901500327883", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.477
24	29	2026-03-21 00:00:00	9750	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА	312335137904	40802810607000057059	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814204 от 20.03.2026 г. НДС не облагается.	\N	{4136814204}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "21.03.2026", "Номер": "29", "ОКАТО": "", "Сумма": "9750", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312335137904", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810607000057059", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814204 от 20.03.2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810607000057059", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.483
25	598484	2026-03-22 00:00:00	7838.41	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 21.03.2026. Сумма комиссии 241 руб. 59 коп. НДС не облагается.	\N	{}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "22.03.2026", "Номер": "598484", "ОКАТО": "", "Сумма": "7838.41", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 21.03.2026. Сумма комиссии 241 руб. 59 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.485
31	129	2026-03-23 00:00:00	3600	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000193 от 20 марта 2026 г. без НДС	52	{СЧ-000193}	matched	2026-03-24 17:54:33.503	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "129", "ОКАТО": "", "Сумма": "3600", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000193 от 20 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.504
26	159734	2026-03-23 00:00:00	1639.47	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 22.03.2026. Сумма комиссии 50 руб. 53 коп. НДС не облагается.	\N	{}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "159734", "ОКАТО": "", "Сумма": "1639.47", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 22.03.2026. Сумма комиссии 50 руб. 53 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.488
27	359	2026-03-22 00:00:00	12960	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000190 от 20 марта 2026 г. НДС не облагается.	56	{СЧ-000190}	matched	2026-03-24 17:54:33.489	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "22.03.2026", "Номер": "359", "ОКАТО": "", "Сумма": "12960", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000190 от 20 марта 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.49
28	360	2026-03-22 00:00:00	7300	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № 4136814210 от 20 марта 2026 г. НДС не облагается.	56	{4136814210}	matched	2026-03-24 17:54:33.492	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "22.03.2026", "Номер": "360", "ОКАТО": "", "Сумма": "7300", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № 4136814210 от 20 марта 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.493
29	128	2026-03-23 00:00:00	4750	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000192 от 20 марта 2026 г. без НДС	52	{СЧ-000192}	matched	2026-03-24 17:54:33.495	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "128", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000192 от 20 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.497
30	127	2026-03-23 00:00:00	22590	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № 664 от 20 марта 2026 г. без НДС	52	{664}	matched	2026-03-24 17:54:33.5	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "127", "ОКАТО": "", "Сумма": "22590", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № 664 от 20 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.501
33	42	2026-03-23 00:00:00	1240	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000204 от 21 марта 2026 года без НДС	33	{СЧ-000204}	matched	2026-03-24 17:54:33.508	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "42", "ОКАТО": "", "Сумма": "1240", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000204 от 21 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.509
34	34	2026-03-23 00:00:00	850	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814162 от 11 марта 2026 г., без НДС	70	{4136814162}	matched	2026-03-24 17:54:33.511	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "34", "ОКАТО": "", "Сумма": "850", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814162 от 11 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.511
288	89430	2026-04-03 00:00:00	900	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000491 от 03 апреля 2026 г. НДС не облагается	38	{СЧ-000491}	matched	2026-04-06 10:37:54.543	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "03.04.2026", "Номер": "89430", "ОКАТО": "", "Сумма": "900", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000491 от 03 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.544
35	41	2026-03-23 00:00:00	620	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000167 от 19 марта 2026 года без НДС	33	{СЧ-000167}	matched	2026-03-24 17:54:33.513	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "41", "ОКАТО": "", "Сумма": "620", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000167 от 19 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.514
36	33	2026-03-23 00:00:00	1700	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814148 от 06 марта 2026 г., без НДС	70	{4136814148}	matched	2026-03-24 17:54:33.515	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "33", "ОКАТО": "", "Сумма": "1700", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814148 от 06 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.516
37	43	2026-03-23 00:00:00	4500	incoming	Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ	312302984310	40802810811680002018	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету СЧ-000130 от 18.03.2026г. . за транспортные услуги. НДС не облагается	35	{СЧ-000130}	matched	2026-03-24 17:54:33.517	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "43", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312302984310", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810811680002018", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000130 от 18.03.2026г. . за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810811680002018", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.518
38	18	2026-03-23 00:00:00	940	incoming	Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА	310900893545	40802810200810075730	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814198 от 20.03.26. НДС не облагается - 940.00 руб. НДС не облагается	\N	{4136814198}	unmatched	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "23.03.2026", "Номер": "18", "ОКАТО": "", "Сумма": "940", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "310900893545", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810200810075730", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814198 от 20.03.26. НДС не облагается - 940.00 руб. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810200810075730", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.52
23	646289	2026-03-21 00:00:00	60333.04	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 20.03.2026. Сумма комиссии 1946 руб. 96 коп., в т.ч. НДС 22% 84 руб. 30 коп.	\N	{}	ignored	\N	a67dca8d-779c-447c-b159-57ac1edada05	{"Дата": "21.03.2026", "Номер": "646289", "ОКАТО": "", "Сумма": "60333.04", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "23.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 20.03.2026. Сумма комиссии 1946 руб. 96 коп., в т.ч. НДС 22% 84 руб. 30 коп.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-24 17:54:33.48
289	675604	2026-04-04 00:00:00	9895.02	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 03.04.2026. Сумма комиссии 304 руб. 98 коп. НДС не облагается.	\N	{}	unmatched	\N	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "04.04.2026", "Номер": "675604", "ОКАТО": "", "Сумма": "9895.02", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 03.04.2026. Сумма комиссии 304 руб. 98 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.547
290	691924	2026-04-05 00:00:00	4753.49	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 04.04.2026. Сумма комиссии 146 руб. 51 коп. НДС не облагается.	\N	{}	unmatched	\N	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "05.04.2026", "Номер": "691924", "ОКАТО": "", "Сумма": "4753.49", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 04.04.2026. Сумма комиссии 146 руб. 51 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.55
291	22	2026-04-04 00:00:00	6150	incoming	Индивидуальный предприниматель Маслова Мария Сергеевна	312338385013	40802810901500327883	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000488 от 03 апреля 2026 г. без НДС	113	{СЧ-000488}	matched	2026-04-06 10:37:54.552	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "04.04.2026", "Номер": "22", "ОКАТО": "", "Сумма": "6150", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Маслова Мария Сергеевна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Маслова Мария Сергеевна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312338385013", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901500327883", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000488 от 03 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901500327883", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.553
292	100	2026-04-06 00:00:00	12000	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АСТРА"	3123449761	40702810702970004154	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Счет на оплату № СЧ-000381 и № СЧ-000380 от 31 марта 2026 г. НДС не облагается	97	{СЧ-000381,СЧ-000380}	matched	2026-04-06 10:37:54.554	26c5919f-6c0a-463e-865e-54746501a3e6	{"Код": "0", "Дата": "06.04.2026", "Номер": "100", "ОКАТО": "", "Сумма": "12000", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"АСТРА\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"АСТРА\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "3123449761", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810702970004154", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000381 и № СЧ-000380 от 31 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810702970004154", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.556
226	997560	2026-04-02 00:00:00	6500	incoming	БАБИНОВА ЮЛИЯ НИКОЛАЕВНА	312334464306	40817810100047388123	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *0046, Оплата по счету №СЧ-000386 от 31 марта 2026 г. НДС не облагается	36	{СЧ-000386}	matched	2026-04-02 19:08:01.413	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "997560", "ОКАТО": "", "Сумма": "6500", "ВидОплаты": "01", "Плательщик": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312334464306", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810100047388123", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *0046, Оплата по счету №СЧ-000386 от 31 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810100047388123", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.414
227	118238	2026-04-02 00:00:00	7500	incoming	БАБИНОВА ЮЛИЯ НИКОЛАЕВНА	312334464306	40817810100047388123	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *0046, Оплата по счету №СЧ-000387 от 31 марта 2026 г. НДС не облагается	36	{СЧ-000387}	matched	2026-04-02 19:08:01.418	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "118238", "ОКАТО": "", "Сумма": "7500", "ВидОплаты": "01", "Плательщик": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312334464306", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810100047388123", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *0046, Оплата по счету №СЧ-000387 от 31 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810100047388123", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.42
228	11117	2026-04-02 00:00:00	520	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000368 от 31 марта 2026 г. НДС не облагается	38	{СЧ-000368}	matched	2026-04-02 19:08:01.421	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "11117", "ОКАТО": "", "Сумма": "520", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000368 от 31 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.422
229	165010	2026-04-02 00:00:00	420	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000218 от 24 марта 2026 г. НДС не облагается	38	{СЧ-000218}	matched	2026-04-02 19:08:01.424	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "165010", "ОКАТО": "", "Сумма": "420", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000218 от 24 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.426
230	679066	2026-04-02 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000195 от 20 марта 2026 г. НДС не облагается	38	{СЧ-000195}	matched	2026-04-02 19:08:01.427	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "679066", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000195 от 20 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.428
231	27681	2026-04-02 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000115 от 17 марта 2026 г. НДС не облагается	38	{СЧ-000115}	matched	2026-04-02 19:08:01.43	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "27681", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000115 от 17 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.432
232	29	2026-04-02 00:00:00	32050	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОВАЛЕНКО АНАСТАСИЯ ОЛЕГОВНА	312333114404	40802810100002338356	044525974	АО "ТБанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Счет на оплату №4136814142 от 06 марта 2026 г. За транспортные услуги. НДС не облагается	\N	{4136814142}	unmatched	\N	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Код": "0", "Дата": "02.04.2026", "Номер": "29", "ОКАТО": "", "Сумма": "32050", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОВАЛЕНКО АНАСТАСИЯ ОЛЕГОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОВАЛЕНКО АНАСТАСИЯ ОЛЕГОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312333114404", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810100002338356", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату №4136814142 от 06 марта 2026 г. За транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810100002338356", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.436
233	334345	2026-04-02 00:00:00	5320	incoming	Скрадина Любовь Олеговна	312103091311	40817810610164036501	042007855	ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000471 от 02 апреля 2026 г.	115	{СЧ-000471}	matched	2026-04-02 19:08:01.438	70664fdc-3a75-43c9-88f1-7fcf85f35a3c	{"Дата": "02.04.2026", "Номер": "334345", "ОКАТО": "", "Сумма": "5320", "ВидОплаты": "01", "Плательщик": "Скрадина Любовь Олеговна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Скрадина Любовь Олеговна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "042007855", "ПлательщикИНН": "312103091311", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810610164036501", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000471 от 02 апреля 2026 г.", "ПлательщикКорсчет": "30101810545250000855", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810610164036501", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 19:08:01.439
293	60	2026-04-06 00:00:00	4920	incoming	Индивидуальный предприниматель Чуева Анна Андреевна	312823368711	40802810301500338715	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000443 от 02 апреля 2026 г. за транспортные услуги. без НДС	94	{СЧ-000443}	matched	2026-04-06 10:37:54.557	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "06.04.2026", "Номер": "60", "ОКАТО": "", "Сумма": "4920", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чуева Анна Андреевна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Чуева Анна Андреевна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312823368711", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810301500338715", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000443 от 02 апреля 2026 г. за транспортные услуги. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810301500338715", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.558
79	460	2026-03-25 00:00:00	2540	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДЕРБИНА АНАСТАСИЯ ВАЛЕРЬЕВНА	312328041479	40802810407000108153	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814206 от 20.03.26. НДС не облагается. - 2540.00 руб.	\N	{4136814206}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "460", "ОКАТО": "", "Сумма": "2540", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДЕРБИНА АНАСТАСИЯ ВАЛЕРЬЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДЕРБИНА АНАСТАСИЯ ВАЛЕРЬЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312328041479", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810407000108153", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814206 от 20.03.26. НДС не облагается. - 2540.00 руб.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810407000108153", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.051
80	31	2026-03-25 00:00:00	2900	incoming	ООО "АГРОВИ"	3123305784	40702810607000012880	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету № СЧ-000257 от 25.03.26 за транспортные услуги Белгород-Курск. НДС не облагается.	54	{СЧ-000257}	matched	2026-03-30 09:15:17.053	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "31", "ОКАТО": "", "Сумма": "2900", "ВидОплаты": "01", "Плательщик": "ООО \\"АГРОВИ\\"", "Получатель": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ООО \\"АГРОВИ\\"", "Получатель1": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "3123305784", "ПлательщикКПП": "312701001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810607000012880", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000257 от 25.03.26 за транспортные услуги Белгород-Курск. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810607000012880", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.055
87	45	2026-03-26 00:00:00	800	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000230 от 24 марта 2026 года без НДС	33	{СЧ-000230}	matched	2026-03-30 09:15:17.07	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "45", "ОКАТО": "", "Сумма": "800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000230 от 24 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.071
88	43	2026-03-26 00:00:00	700	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000209 от 23 марта 2026 года без НДС	33	{СЧ-000209}	matched	2026-03-30 09:15:17.072	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "43", "ОКАТО": "", "Сумма": "700", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000209 от 23 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.073
73	910411	2026-03-24 00:00:00	5190.03	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 23.03.2026. Сумма комиссии 159 руб. 97 коп. НДС не облагается.	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "24.03.2026", "Номер": "910411", "ОКАТО": "", "Сумма": "5190.03", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "24.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 23.03.2026. Сумма комиссии 159 руб. 97 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.036
74	93	2026-03-24 00:00:00	10630	incoming	ООО "ЗЕЛЕНЫЙ МИР"	3123218073	40702810209740002466	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги. Сумма 10630-00 Без налога (НДС)	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "24.03.2026", "Номер": "93", "ОКАТО": "", "Сумма": "10630", "ВидОплаты": "01", "Плательщик": "ООО \\"ЗЕЛЕНЫЙ МИР\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ООО \\"ЗЕЛЕНЫЙ МИР\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "24.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "3123218073", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810209740002466", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги. Сумма 10630-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810209740002466", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.04
75	942531	2026-03-25 00:00:00	824.58	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 24.03.2026. Сумма комиссии 25 руб. 42 коп. НДС не облагается.	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "942531", "ОКАТО": "", "Сумма": "824.58", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 24.03.2026. Сумма комиссии 25 руб. 42 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.042
76	120	2026-03-25 00:00:00	22500	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814212 от 20.03.26. НДС не облагается- 22500.00 руб.	73	{4136814212}	matched	2026-03-30 09:15:17.043	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "25.03.2026", "Номер": "120", "ОКАТО": "", "Сумма": "22500", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814212 от 20.03.26. НДС не облагается- 22500.00 руб.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.044
77	14	2026-03-25 00:00:00	1100	incoming	Индивидуальный предприниматель Чаусова Юлия Геннадьевна	312323052364	40802810201500474151	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000243 от 25 марта 2026 без НДС	72	{СЧ-000243}	matched	2026-03-30 09:15:17.046	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "14", "ОКАТО": "", "Сумма": "1100", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чаусова Юлия Геннадьевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Чаусова Юлия Геннадьевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312323052364", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810201500474151", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000243 от 25 марта 2026 без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810201500474151", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.047
81	22	2026-03-25 00:00:00	9660	incoming	ВОРОНИН АЛЕКСЕЙ ГЕОРГИЕВИЧ (ИП)	312302111026	40802810902970004922	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету 651 от 25.02.2026г., по счету 655 от 27.02.2026г., по счету №191 от 20.03.2026г. НДС не облагается	62	{191}	matched	2026-03-30 09:15:17.057	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "22", "ОКАТО": "", "Сумма": "9660", "ВидОплаты": "01", "Плательщик": "ВОРОНИН АЛЕКСЕЙ ГЕОРГИЕВИЧ (ИП)", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ВОРОНИН АЛЕКСЕЙ ГЕОРГИЕВИЧ (ИП)", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312302111026", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810902970004922", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету 651 от 25.02.2026г., по счету 655 от 27.02.2026г., по счету №191 от 20.03.2026г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810902970004922", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.058
82	218	2026-03-25 00:00:00	1690	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА	312313448504	40802810107000022416	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата за транспортные услуги по счету №4136814207 от 20.03.26. НДС не облагается.	\N	{4136814207}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "25.03.2026", "Номер": "218", "ОКАТО": "", "Сумма": "1690", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "25.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312313448504", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000022416", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по счету №4136814207 от 20.03.26. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000022416", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.061
83	186993	2026-03-26 00:00:00	1639.47	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 25.03.2026. Сумма комиссии 50 руб. 53 коп. НДС не облагается.	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "186993", "ОКАТО": "", "Сумма": "1639.47", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 25.03.2026. Сумма комиссии 50 руб. 53 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.063
84	11	2026-03-26 00:00:00	4500	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000235 от 25 марта 2026 без НДС	\N	{СЧ-000235}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "11", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000235 от 25 марта 2026 без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.065
85	46	2026-03-26 00:00:00	1020	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000283 от 25 марта 2026 года без НДС	33	{СЧ-000283}	matched	2026-03-30 09:15:17.066	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "46", "ОКАТО": "", "Сумма": "1020", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000283 от 25 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.067
86	47	2026-03-26 00:00:00	10250	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814217 от 26.03.26. НДС не облагается - 10250.00 руб.	33	{4136814217}	matched	2026-03-30 09:15:17.068	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "47", "ОКАТО": "", "Сумма": "10250", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814217 от 26.03.26. НДС не облагается - 10250.00 руб.", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.069
90	46	2026-03-26 00:00:00	4850	incoming	Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ	312302984310	40802810811680002018	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету СЧ-000188, СЧ-000181, СЧ -000196 от 20.03.2026 г. . за транспортные услуги. НДС не облагается	35	{СЧ-000188,СЧ-000181}	matched	2026-03-30 09:15:17.076	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "46", "ОКАТО": "", "Сумма": "4850", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312302984310", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810811680002018", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000188, СЧ-000181, СЧ -000196 от 20.03.2026 г. . за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810811680002018", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.077
91	35	2026-03-26 00:00:00	950	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ	312328906299	40802810307000105515	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814187 от 13.03.26. НДС не облагается - 950.00 руб.	88	{4136814187}	matched	2026-03-30 09:15:17.078	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "35", "ОКАТО": "", "Сумма": "950", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312328906299", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810307000105515", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814187 от 13.03.26. НДС не облагается - 950.00 руб.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810307000105515", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.079
92	121	2026-03-26 00:00:00	4750	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА	311301471962	40802810600002105267	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Счет на оплату № СЧ-000299 от 26 марта НДС не облагается	55	{СЧ-000299}	matched	2026-03-30 09:15:17.08	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "121", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "311301471962", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600002105267", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000299 от 26 марта НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600002105267", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.081
93	66	2026-03-26 00:00:00	4800	incoming	Индивидуальный предприниматель Максимчук Олег Викторович	312605708076	40802810908500023300	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000162 от 18 марта 2026 г. без НДС	53	{СЧ-000162}	matched	2026-03-30 09:15:17.082	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "66", "ОКАТО": "", "Сумма": "4800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Максимчук Олег Викторович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312605708076", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810908500023300", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000162 от 18 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810908500023300", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.083
89	44	2026-03-26 00:00:00	1800	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету сч-000214 от 23 марта 2026 года без НДС	33	{СЧ-000214}	matched	2026-03-30 09:15:17.074	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "44", "ОКАТО": "", "Сумма": "1800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету сч-000214 от 23 марта 2026 года без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.075
96	187	2026-03-26 00:00:00	890	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПРОМОП"	3123208910	40702810902970007634	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету № СЧ-000301 от 26.03.2026 г. за транспортные услуги. Сумма 890-00 Без налога (НДС)	65	{СЧ-000301}	matched	2026-03-30 09:15:17.088	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "187", "ОКАТО": "", "Сумма": "890", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ПРОМОП\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ПРОМОП\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "3123208910", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810902970007634", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000301 от 26.03.2026 г. за транспортные услуги. Сумма 890-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810902970007634", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.089
97	188	2026-03-26 00:00:00	1780	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПРОМОП"	3123208910	40702810902970007634	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету № СЧ-000300 от 26.03.2026 г. за транспортные услуги. Сумма 1780-00 Без налога (НДС)	65	{СЧ-000300}	matched	2026-03-30 09:15:17.091	533a1522-a013-40f5-804b-133409a36915	{"Дата": "26.03.2026", "Номер": "188", "ОКАТО": "", "Сумма": "1780", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ПРОМОП\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ПРОМОП\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "3123208910", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810902970007634", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000300 от 26.03.2026 г. за транспортные услуги. Сумма 1780-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810902970007634", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.092
98	368728	2026-03-27 00:00:00	14260.47	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 26.03.2026. Сумма комиссии 439 руб. 53 коп. НДС не облагается.	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "368728", "ОКАТО": "", "Сумма": "14260.47", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 26.03.2026. Сумма комиссии 439 руб. 53 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.094
99	143	2026-03-27 00:00:00	5500	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000267 от 25 марта 2026 г. без НДС	52	{СЧ-000267}	matched	2026-03-30 09:15:17.096	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "27.03.2026", "Номер": "143", "ОКАТО": "", "Сумма": "5500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000267 от 25 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.097
94	27	2026-03-26 00:00:00	2700	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ	312324160002	40802810700000149714	044525974	АО "ТБанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Счет на оплату № 4136814147 от 06 марта 2026 г. НДС не облагается	77	{4136814147}	matched	2026-03-30 09:15:17.084	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "26.03.2026", "Номер": "27", "ОКАТО": "", "Сумма": "2700", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312324160002", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810700000149714", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № 4136814147 от 06 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810700000149714", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.085
95	28	2026-03-26 00:00:00	3120	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ	312324160002	40802810700000149714	044525974	АО "ТБанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Счет на оплату № СЧ-000264 от 25 марта 2026 г. НДС не облагается	77	{СЧ-000264}	matched	2026-03-30 09:15:17.086	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "26.03.2026", "Номер": "28", "ОКАТО": "", "Сумма": "3120", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ВЕТРЕНКО ВЯЧЕСЛАВ ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "26.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312324160002", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810700000149714", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000264 от 25 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810700000149714", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.087
100	144	2026-03-27 00:00:00	5250	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000268 от 25 марта 2026 г. без НДС	52	{СЧ-000268}	matched	2026-03-30 09:15:17.099	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "144", "ОКАТО": "", "Сумма": "5250", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000268 от 25 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.1
101	12	2026-03-27 00:00:00	4750	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000297 от 26 марта 2026 г. без НДС	\N	{СЧ-000297}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "12", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000297 от 26 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.102
107	5	2026-03-27 00:00:00	850	incoming	Индивидуальный предприниматель Иващенко Марина Владимировна	312321334677	40802810720000620669	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814223 от 27.03.26. НДС не облагается - 850.00 руб.	\N	{4136814223}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "5", "ОКАТО": "", "Сумма": "850", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иващенко Марина Владимировна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иващенко Марина Владимировна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312321334677", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810720000620669", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814223 от 27.03.26. НДС не облагается - 850.00 руб.", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810720000620669", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.116
123	69014	2026-03-31 00:00:00	1980	incoming	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	40802810420000471257	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	без НДС	105	{}	matched	2026-04-01 09:38:10.96	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "69014", "ОКАТО": "", "Сумма": "1980", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311702951839", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810420000471257", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810420000471257", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.961
102	402	2026-03-27 00:00:00	4830	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Подольск счёт № СЧ-000324 от 27 марта НДС не облагается.	56	{СЧ-000324}	matched	2026-03-30 09:15:17.103	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "402", "ОКАТО": "", "Сумма": "4830", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Подольск счёт № СЧ-000324 от 27 марта НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.105
103	401	2026-03-27 00:00:00	13610	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000320 от 27 марта НДС не облагается.	56	{СЧ-000320}	matched	2026-03-30 09:15:17.106	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "401", "ОКАТО": "", "Сумма": "13610", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000320 от 27 марта НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.107
104	21	2026-03-27 00:00:00	1600	incoming	Лотков Денис Анатольевич (ИП)	312325602905	40802810802970011523	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету СЧ-000255 от 25 марта 2026 за транспортные услуги. НДС не облагается	81	{СЧ-000255}	matched	2026-03-30 09:15:17.108	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "21", "ОКАТО": "", "Сумма": "1600", "ВидОплаты": "01", "Плательщик": "Лотков Денис Анатольевич (ИП)", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "Лотков Денис Анатольевич (ИП)", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312325602905", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810802970011523", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000255 от 25 марта 2026 за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810802970011523", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.109
105	69012	2026-03-27 00:00:00	28800	incoming	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	40802810420000471257	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	без НДС	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "69012", "ОКАТО": "", "Сумма": "28800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311702951839", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810420000471257", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810420000471257", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.112
106	553063	2026-03-27 00:00:00	4750	incoming	БАБИНОВА ЮЛИЯ НИКОЛАЕВНА	312334464306	40817810100047388123	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *0046, Оплата по счету №СЧ-000298 от 26 марта 2026 г. НДС не облагается	36	{СЧ-000298}	matched	2026-03-30 09:15:17.113	533a1522-a013-40f5-804b-133409a36915	{"Дата": "27.03.2026", "Номер": "553063", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "27.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312334464306", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810100047388123", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *0046, Оплата по счету №СЧ-000298 от 26 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810100047388123", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.114
108	872387	2026-03-28 00:00:00	8420.47	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 27.03.2026. Сумма комиссии 259 руб. 53 коп. НДС не облагается.	\N	{}	unmatched	\N	533a1522-a013-40f5-804b-133409a36915	{"Дата": "28.03.2026", "Номер": "872387", "ОКАТО": "", "Сумма": "8420.47", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 27.03.2026. Сумма комиссии 259 руб. 53 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.121
109	573885	2026-03-29 00:00:00	3600	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000336 от 27 марта 2026 г. НДС не облагается	38	{СЧ-000336}	matched	2026-03-30 09:15:17.123	533a1522-a013-40f5-804b-133409a36915	{"Дата": "29.03.2026", "Номер": "573885", "ОКАТО": "", "Сумма": "3600", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000336 от 27 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.125
110	126	2026-03-29 00:00:00	7850	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000319 от 27 марта 2026 г.	73	{СЧ-000319}	matched	2026-03-30 09:15:17.127	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "29.03.2026", "Номер": "126", "ОКАТО": "", "Сумма": "7850", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000319 от 27 марта 2026 г.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.128
111	96	2026-03-27 00:00:00	4300	incoming	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	40802810370010393288	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814221 от 27.03.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС	87	{4136814221}	matched	2026-03-30 09:15:17.129	533a1522-a013-40f5-804b-133409a36915	{"Код": "0", "Дата": "27.03.2026", "Номер": "96", "ОКАТО": "", "Сумма": "4300", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "312320726304", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810370010393288", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814221 от 27.03.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810370010393288", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.13
112	47	2026-03-30 00:00:00	200	incoming	Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ	312302984310	40802810811680002018	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету СЧ-000341 от 27.03.2026 г. . за транспортные услуги. НДС не облагается	35	{СЧ-000341}	matched	2026-03-30 09:15:17.132	533a1522-a013-40f5-804b-133409a36915	{"Дата": "30.03.2026", "Номер": "47", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312302984310", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810811680002018", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000341 от 27.03.2026 г. . за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810811680002018", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-03-30 09:15:17.133
344	40	2026-04-09 00:00:00	2700	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА	621403086153	40802810353000039113	046126614	РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ А. А.	302201915296	40802810100002843508	НДС не облагается.	42	{}	matched	2026-04-09 17:15:01.49	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "40", "ОКАТО": "", "Сумма": "2700", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель": "ИП СОЛОВЬЕВ А. А.", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель1": "ИП СОЛОВЬЕВ А. А.", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "046126614", "ПлательщикИНН": "621403086153", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810353000039113", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "НДС не облагается.", "ПлательщикКорсчет": "30101810500000000614", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810353000039113", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.491
118	182	2026-03-30 00:00:00	12400	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЕВРО СПРЕЙ"	3123460003	40702810600990002310	044525176	ПАО АКБ "Металлинвестбанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата счетов 4136814216 от 24.03.2026, сч-000171, СЧ-000169, сч-000170 от 19.03.2026 и сч-000200 от 20.03.2026. (транспортные услуги). Без НДС	29	{СЧ-000171,СЧ-000169,СЧ-000170,СЧ-000200}	matched	2026-04-01 09:38:10.912	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "30.03.2026", "Номер": "182", "ОКАТО": "", "Сумма": "12400", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "044525176", "ПлательщикИНН": "3123460003", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810600990002310", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"Металлинвестбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата счетов 4136814216 от 24.03.2026, сч-000171, СЧ-000169, сч-000170 от 19.03.2026 и сч-000200 от 20.03.2026. (транспортные услуги). Без НДС", "ПлательщикКорсчет": "30101810300000000176", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810600990002310", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.914
119	81	2026-03-30 00:00:00	7312	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА	312336675817	40802810007000072553	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000322 от 27 марта 2026 г. НДС не облагается.	57	{СЧ-000322}	matched	2026-04-01 09:38:10.917	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "30.03.2026", "Номер": "81", "ОКАТО": "", "Сумма": "7312", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "30.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312336675817", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810007000072553", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000322 от 27 марта 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810007000072553", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.918
120	267517	2026-03-31 00:00:00	35486.26	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 30.03.2026. Сумма комиссии 1093 руб. 74 коп. НДС не облагается.	\N	{}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "267517", "ОКАТО": "", "Сумма": "35486.26", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 30.03.2026. Сумма комиссии 1093 руб. 74 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.922
121	3	2026-03-30 00:00:00	1040	incoming	ГОНЧАРЕНКО НАДЕЖДА ВЛАДИМИРОВНА (ИП)	312334410163	40802810301620001274	044525593	АО "АЛЬФА-БАНК"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	оплата транспортных услуг, НДС не облагается	\N	{}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "30.03.2026", "Номер": "3", "ОКАТО": "", "Сумма": "1040", "ВидОплаты": "01", "Плательщик": "ГОНЧАРЕНКО НАДЕЖДА ВЛАДИМИРОВНА (ИП)", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАРЕНКО НАДЕЖДА ВЛАДИМИРОВНА (ИП)", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312334410163", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810301620001274", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "оплата транспортных услуг, НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810301620001274", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.927
122	18	2026-03-31 00:00:00	4280	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АУЛОВА ЕЛЕНА НИКОЛАЕВНА	312318008708	40802810307000072295	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ А. А.	302201915296	40802810100002843508	НДС не облагается. Счета 202,210, 223, 277, 306, 357 и 360 за март 2026	45	{}	matched	2026-04-01 09:38:10.93	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "18", "ОКАТО": "", "Сумма": "4280", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АУЛОВА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ А. А.", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АУЛОВА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ А. А.", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312318008708", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810307000072295", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "НДС не облагается. Счета 202,210, 223, 277, 306, 357 и 360 за март 2026", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810307000072295", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.931
124	69013	2026-03-31 00:00:00	2080	incoming	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	40802810420000471257	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	без НДС	105	{}	matched	2026-04-01 09:38:10.963	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "69013", "ОКАТО": "", "Сумма": "2080", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311702951839", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810420000471257", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810420000471257", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.965
125	69015	2026-03-31 00:00:00	18460	incoming	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	40802810420000471257	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	без НДС	105	{}	matched	2026-04-01 09:38:10.967	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "69015", "ОКАТО": "", "Сумма": "18460", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311702951839", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810420000471257", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810420000471257", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.968
126	93	2026-03-31 00:00:00	16910	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ	312332151900	40802810600006217216	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата услуг В т.ч. НДС 0% - 0 руб	71	{}	matched	2026-04-01 09:38:10.971	0aabe47d-529f-446a-a3f5-e599cb943078	{"Код": "0", "Дата": "31.03.2026", "Номер": "93", "ОКАТО": "", "Сумма": "16910", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312332151900", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600006217216", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата услуг В т.ч. НДС 0% - 0 руб", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600006217216", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.973
127	717330	2026-03-31 00:00:00	14850	incoming	Куницын Евгений Юрьевич	312118182378	40817810920166001813	042007855	ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000382 от 31 марта 2026 г.	103	{СЧ-000382}	matched	2026-04-01 09:38:10.975	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "717330", "ОКАТО": "", "Сумма": "14850", "ВидОплаты": "01", "Плательщик": "Куницын Евгений Юрьевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Куницын Евгений Юрьевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "042007855", "ПлательщикИНН": "312118182378", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810920166001813", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ФИЛИАЛ № 3652 БАНКА ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000382 от 31 марта 2026 г.", "ПлательщикКорсчет": "30101810545250000855", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810920166001813", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.976
128	278	2026-03-31 00:00:00	45685.5	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "УПРАВЛЕНИЕ МЕХАНИЗАЦИИ"	3123116032	40702810602970006870	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету № 4136814224 от 30.03.2026 г. за транспортные услуги. НДС не облагается	\N	{4136814224}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "278", "ОКАТО": "", "Сумма": "45685.5", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"УПРАВЛЕНИЕ МЕХАНИЗАЦИИ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"УПРАВЛЕНИЕ МЕХАНИЗАЦИИ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "3123116032", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810602970006870", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № 4136814224 от 30.03.2026 г. за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810602970006870", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.98
134	32	2026-03-31 00:00:00	28790	incoming	ООО "КОТОФИЛ"	2540278854	40702810509740002357	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по счету №376,289,335,359,231,219,177,215,176,229,364,365 Сумма 28790-00 Без налога (НДС)	50	{"376,289,335,359,231,219,177,215,176,229,364,365"}	matched	2026-04-01 09:38:10.996	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "32", "ОКАТО": "", "Сумма": "28790", "ВидОплаты": "01", "Плательщик": "ООО \\"КОТОФИЛ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ООО \\"КОТОФИЛ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "2540278854", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810509740002357", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по счету №376,289,335,359,231,219,177,215,176,229,364,365 Сумма 28790-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810509740002357", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.998
129	1	2026-03-31 00:00:00	200	incoming	Косов Евгений Сергеевич	312330327820	40817810800009413969	044525068	ООО "ОЗОН Банк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000343 от 27 марта 2026 г.	\N	{СЧ-000343}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "1", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Косов Евгений Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Косов Евгений Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525068", "ПлательщикИНН": "312330327820", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810800009413969", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"ОЗОН Банк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000343 от 27 марта 2026 г.", "ПлательщикКорсчет": "30101810645374525068", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810800009413969", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.983
130	50	2026-03-31 00:00:00	3740	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000370 от 31 марта 2026 г. без НДС	33	{СЧ-000370}	matched	2026-04-01 09:38:10.985	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "50", "ОКАТО": "", "Сумма": "3740", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000370 от 31 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.986
131	2	2026-03-31 00:00:00	200	incoming	Индивидуальный предприниматель Иевлев Сергей Сергеевич	311500693166	40802810201500515353	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000281 от 25 марта 2026 г. без НДС	\N	{СЧ-000281}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "2", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иевлев Сергей Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Иевлев Сергей Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311500693166", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810201500515353", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000281 от 25 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810201500515353", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.989
132	419	2026-03-31 00:00:00	7075	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000388 от 31 марта 2026 НДС не облагается.	56	{СЧ-000388}	matched	2026-04-01 09:38:10.991	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "419", "ОКАТО": "", "Сумма": "7075", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000388 от 31 марта 2026 НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.992
133	40	2026-03-31 00:00:00	400	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ	312006684524	40802810100005266603	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000332 от 27 марта 2026 г. НДС не облагается	51	{СЧ-000332}	matched	2026-04-01 09:38:10.994	0aabe47d-529f-446a-a3f5-e599cb943078	{"Код": "0", "Дата": "31.03.2026", "Номер": "40", "ОКАТО": "", "Сумма": "400", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312006684524", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810100005266603", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000332 от 27 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810100005266603", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:10.995
135	514903	2026-03-31 00:00:00	3200	incoming	АО "ТБанк"	7710140679	30232810600003197537	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Пополнение по операции СБП 8222530319. Терминал Solovyov-express	\N	{}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "514903", "ОКАТО": "", "Сумма": "3200", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810600003197537", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Пополнение по операции СБП 8222530319. Терминал Solovyov-express", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810600003197537", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.001
136	154	2026-03-31 00:00:00	1200	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА	312330492180	40802810507000105933	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счетам за FBS 2026 г. НДС не облагается.	49	{}	matched	2026-04-01 09:38:11.002	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "154", "ОКАТО": "", "Сумма": "1200", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312330492180", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810507000105933", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счетам за FBS 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810507000105933", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.004
137	155	2026-03-31 00:00:00	23450	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА	312330492180	40802810507000105933	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814218 от 27.03.26. НДС не облагается. - 23450.00 руб.	49	{4136814218}	matched	2026-04-01 09:38:11.006	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "31.03.2026", "Номер": "155", "ОКАТО": "", "Сумма": "23450", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "31.03.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312330492180", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810507000105933", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814218 от 27.03.26. НДС не облагается. - 23450.00 руб.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810507000105933", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.007
138	645108	2026-04-01 00:00:00	1552.16	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 31.03.2026. Сумма комиссии 47 руб. 84 коп. НДС не облагается.	\N	{}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "645108", "ОКАТО": "", "Сумма": "1552.16", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 31.03.2026. Сумма комиссии 47 руб. 84 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.01
139	436	2026-04-01 00:00:00	12200	incoming	Индивидуальный предприниматель Широкая Алиса Алексеевна	637592639150	40802810570010468900	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату СЧ-000321 от 27 марта Без НДС	46	{СЧ-000321}	matched	2026-04-01 09:38:11.012	0aabe47d-529f-446a-a3f5-e599cb943078	{"Код": "0", "Дата": "01.04.2026", "Номер": "436", "ОКАТО": "", "Сумма": "12200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Широкая Алиса Алексеевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Широкая Алиса Алексеевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "637592639150", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810570010468900", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату СЧ-000321 от 27 марта Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810570010468900", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.013
140	435	2026-04-01 00:00:00	12130	incoming	Индивидуальный предприниматель Широкая Алиса Алексеевна	637592639150	40802810570010468900	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счёту № СЧ-000327 от 27 марта Без НДС	46	{СЧ-000327}	matched	2026-04-01 09:38:11.015	0aabe47d-529f-446a-a3f5-e599cb943078	{"Код": "0", "Дата": "01.04.2026", "Номер": "435", "ОКАТО": "", "Сумма": "12130", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Широкая Алиса Алексеевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Широкая Алиса Алексеевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "637592639150", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810570010468900", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счёту № СЧ-000327 от 27 марта Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810570010468900", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.016
141	599125	2026-04-01 00:00:00	4500	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000389 от 01 апреля 2026 г. НДС не облагается	38	{СЧ-000389}	matched	2026-04-01 09:38:11.018	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "599125", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000389 от 01 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.019
142	295011	2026-04-01 00:00:00	4570	incoming	АО "ТБанк"	7710140679	45508810800024344545	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *8188, Оплата по счету №СЧ-000260 от 25 марта 2026 г. НДС не облагается	\N	{СЧ-000260}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "295011", "ОКАТО": "", "Сумма": "4570", "ВидОплаты": "01", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "45508810800024344545", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *8188, Оплата по счету №СЧ-000260 от 25 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "45508810800024344545", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.022
143	871384	2026-04-01 00:00:00	4000	incoming	АО "ТБанк"	7710140679	45508810800024344545	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *8188, Оплата по счету №СЧ-000261 от 25 марта 2026 г. НДС не облагается	\N	{СЧ-000261}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "871384", "ОКАТО": "", "Сумма": "4000", "ВидОплаты": "01", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "45508810800024344545", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *8188, Оплата по счету №СЧ-000261 от 25 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "45508810800024344545", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.025
144	986400	2026-04-01 00:00:00	3150	incoming	АО "ТБанк"	7710140679	45508810800024344545	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *8188, Оплата по счету №СЧ-000262 от 25 марта 2026 г. НДС не облагается	\N	{СЧ-000262}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "986400", "ОКАТО": "", "Сумма": "3150", "ВидОплаты": "01", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "45508810800024344545", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *8188, Оплата по счету №СЧ-000262 от 25 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "45508810800024344545", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.028
150	37	2026-04-01 00:00:00	940	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000239 от 25 марта 2026 г., без НДС	70	{СЧ-000239}	matched	2026-04-01 09:38:11.047	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "37", "ОКАТО": "", "Сумма": "940", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000239 от 25 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.048
145	544139	2026-04-01 00:00:00	3630	incoming	АО "ТБанк"	7710140679	45508810800024344545	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *8188, Оплата по счету №СЧ-000263 от 25 марта 2026 г. НДС не облагается	\N	{СЧ-000263}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "544139", "ОКАТО": "", "Сумма": "3630", "ВидОплаты": "01", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "45508810800024344545", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *8188, Оплата по счету №СЧ-000263 от 25 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "45508810800024344545", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.031
146	128	2026-04-01 00:00:00	1470	incoming	ООО "СТИЛБУРГ"	3123477247	40702810425100031982	044525201	ПАО АКБ "АВАНГАРД"	СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)	302201915296	40802810100002843508	Оплата по счету № 4136814225 от 31 марта 2026 г. за картонную упаковку (гофрокороба).  Сумма 1470.00, НДС не облагается	98	{4136814225}	matched	2026-04-01 09:38:11.033	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "128", "ОКАТО": "", "Сумма": "1470", "ВидОплаты": "01", "Плательщик": "ООО \\"СТИЛБУРГ\\"", "Получатель": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Плательщик1": "ООО \\"СТИЛБУРГ\\"", "Получатель1": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525201", "ПлательщикИНН": "3123477247", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810425100031982", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"АВАНГАРД\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № 4136814225 от 31 марта 2026 г. за картонную упаковку (гофрокороба).  Сумма 1470.00, НДС не облагается", "ПлательщикКорсчет": "30101810000000000201", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810425100031982", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.034
147	127	2026-04-01 00:00:00	8175	incoming	ООО "СТИЛБУРГ"	3123477247	40702810425100031982	044525201	ПАО АКБ "АВАНГАРД"	СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)	302201915296	40802810100002843508	Оплата по счету № СЧ-000372 от 31 марта 2026 г за транспортные услуги г. Белгород - г. Невинномысск.  Сумма 8175.00, НДС не облагается	98	{СЧ-000372}	matched	2026-04-01 09:38:11.036	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "127", "ОКАТО": "", "Сумма": "8175", "ВидОплаты": "01", "Плательщик": "ООО \\"СТИЛБУРГ\\"", "Получатель": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Плательщик1": "ООО \\"СТИЛБУРГ\\"", "Получатель1": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525201", "ПлательщикИНН": "3123477247", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810425100031982", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"АВАНГАРД\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000372 от 31 марта 2026 г за транспортные услуги г. Белгород - г. Невинномысск.  Сумма 8175.00, НДС не облагается", "ПлательщикКорсчет": "30101810000000000201", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810425100031982", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.037
148	38	2026-04-01 00:00:00	800	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000329 от 27 марта 2026 г., без НДС	70	{СЧ-000329}	matched	2026-04-01 09:38:11.04	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "38", "ОКАТО": "", "Сумма": "800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000329 от 27 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.042
149	39	2026-04-01 00:00:00	890	incoming	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	40802810320000023161	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000330 от 27 марта 2026 г., без НДС	70	{СЧ-000330}	matched	2026-04-01 09:38:11.044	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "39", "ОКАТО": "", "Сумма": "890", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Кухарев Денис Игоревич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312334828627", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810320000023161", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000330 от 27 марта 2026 г., без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810320000023161", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.045
151	14	2026-04-01 00:00:00	3960	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000393 от 01 апреля 2026 г. без НДС	\N	{СЧ-000393}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "14", "ОКАТО": "", "Сумма": "3960", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000393 от 01 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.051
152	15	2026-04-01 00:00:00	4160	incoming	Индивидуальный предприниматель Шатохина Анастасия Александровна	312337028393	40802810501500308671	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000402 от 01 апреля 2026 г. без НДС	\N	{СЧ-000402}	unmatched	\N	0aabe47d-529f-446a-a3f5-e599cb943078	{"Дата": "01.04.2026", "Номер": "15", "ОКАТО": "", "Сумма": "4160", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Шатохина Анастасия Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312337028393", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810501500308671", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000402 от 01 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810501500308671", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-01 09:38:11.055
266	734617	2026-04-03 00:00:00	5093.02	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 02.04.2026. Сумма комиссии 156 руб. 98 коп. НДС не облагается.	\N	{}	unmatched	\N	af26a572-4b11-4b39-b659-6fd09177a133	{"Дата": "03.04.2026", "Номер": "734617", "ОКАТО": "", "Сумма": "5093.02", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 02.04.2026. Сумма комиссии 156 руб. 98 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-03 11:32:48.52
267	52	2026-04-03 00:00:00	400	incoming	Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ	312301259291	40802810305250001036	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьёв Артём Александрович Счет на оплату	302201915296	40802810100002843508	Оплата по счету № СЧ-000248 от 25.03.2026. В т.ч. НДС {nds} руб.	40	{СЧ-000248}	matched	2026-04-03 11:32:48.522	af26a572-4b11-4b39-b659-6fd09177a133	{"Дата": "03.04.2026", "Номер": "52", "ОКАТО": "", "Сумма": "400", "ВидОплаты": "01", "Плательщик": "Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович Счет на оплату", "Плательщик1": "Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович Счет на оплату", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312301259291", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810305250001036", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000248 от 25.03.2026. В т.ч. НДС {nds} руб.", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810305250001036", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-03 11:32:48.523
268	53	2026-04-03 00:00:00	200	incoming	Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ	312301259291	40802810305250001036	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьёв Артём Александрович Счет на оплату	302201915296	40802810100002843508	Оплата по счету № СЧ-000197 от 20.03.2026. В т.ч. НДС {nds} руб.	40	{СЧ-000197}	matched	2026-04-03 11:32:48.524	af26a572-4b11-4b39-b659-6fd09177a133	{"Дата": "03.04.2026", "Номер": "53", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович Счет на оплату", "Плательщик1": "Индивидуальный Предприниматель ГОНЧАРЕНКО ВАДИМ ПАВЛОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович Счет на оплату", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312301259291", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810305250001036", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000197 от 20.03.2026. В т.ч. НДС {nds} руб.", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810305250001036", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-03 11:32:48.525
269	21	2026-04-03 00:00:00	321793	incoming	Индивидуальный предприниматель Филимонова Виктория Игоревна	463222730700	40802810101500478862	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счетам за транспортные услуги и паллетирование Сумма: 321 793руб. без НДС	\N	{}	unmatched	\N	af26a572-4b11-4b39-b659-6fd09177a133	{"Дата": "03.04.2026", "Номер": "21", "ОКАТО": "", "Сумма": "321793", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Филимонова Виктория Игоревна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Филимонова Виктория Игоревна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "463222730700", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810101500478862", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счетам за транспортные услуги и паллетирование Сумма: 321 793руб. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810101500478862", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-03 11:32:48.527
294	59	2026-04-06 00:00:00	800	incoming	Индивидуальный предприниматель Чуева Анна Андреевна	312823368711	40802810301500338715	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814229 от 06.04.26 за транспортные услуги. без НДС	94	{4136814229}	matched	2026-04-06 10:37:54.56	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "06.04.2026", "Номер": "59", "ОКАТО": "", "Сумма": "800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чуева Анна Андреевна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Чуева Анна Андреевна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312823368711", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810301500338715", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814229 от 06.04.26 за транспортные услуги. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810301500338715", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.561
193	56	2026-04-01 00:00:00	990	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА	310802350773	40802810007000015206	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000408 от 01 апреля 2026 г. НДС не облагается.	34	{СЧ-000408}	matched	2026-04-02 10:29:49.249	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Дата": "01.04.2026", "Номер": "56", "ОКАТО": "", "Сумма": "990", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "310802350773", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810007000015206", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000408 от 01 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810007000015206", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.25
194	55	2026-04-01 00:00:00	1980	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА	310802350773	40802810007000015206	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000400 от 01 апреля 2026 г. НДС не облагается.	34	{СЧ-000400}	matched	2026-04-02 10:29:49.253	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Дата": "01.04.2026", "Номер": "55", "ОКАТО": "", "Сумма": "1980", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДОСМАНОВА СВЕТЛАНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "310802350773", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810007000015206", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000400 от 01 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810007000015206", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.254
195	273	2026-04-01 00:00:00	32400	incoming	ООО "ВРЕКЛАМЕ"	3123449930	40702810305250000111	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата по счету № 4136814226 от 31.03.2026, за доставку Сумма 32400-00 Без налога (НДС)	43	{4136814226}	matched	2026-04-02 10:29:49.256	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Дата": "01.04.2026", "Номер": "273", "ОКАТО": "", "Сумма": "32400", "ВидОплаты": "01", "Плательщик": "ООО \\"ВРЕКЛАМЕ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ООО \\"ВРЕКЛАМЕ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "3123449930", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810305250000111", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № 4136814226 от 31.03.2026, за доставку Сумма 32400-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810305250000111", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.257
198	873921	2026-04-01 00:00:00	940	incoming	ПАО СБЕРБАНК//КОТОВА ПОЛИНА ПЕТРОВНА//7506954234657//308001, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, Г БЕЛГОРОД, ПЕР ДЗЕРЖИНСКОГО, Д 66А КВ 22//	7707083893	30233810642000600001	042202603	ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК	ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	ОПЛАТА ПО СЧЕТУ №СЧ-000399 ОТ 01 АПРЕЛЯ 2026 Г.;01/04/2026	\N	{СЧ-000399}	unmatched	\N	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Дата": "01.04.2026", "Номер": "873921", "ОКАТО": "", "Сумма": "940", "ВидОплаты": "01", "Плательщик": "ПАО СБЕРБАНК//КОТОВА ПОЛИНА ПЕТРОВНА//7506954234657//308001, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, Г БЕЛГОРОД, ПЕР ДЗЕРЖИНСКОГО, Д 66А КВ 22//", "Получатель": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ПАО СБЕРБАНК//КОТОВА ПОЛИНА ПЕТРОВНА//7506954234657//308001, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, Г БЕЛГОРОД, ПЕР ДЗЕРЖИНСКОГО, Д 66А КВ 22//", "Получатель1": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "042202603", "ПлательщикИНН": "7707083893", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "30233810642000600001", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "ОПЛАТА ПО СЧЕТУ №СЧ-000399 ОТ 01 АПРЕЛЯ 2026 Г.;01/04/2026", "ПлательщикКорсчет": "30101810900000000603", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30233810642000600001", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.267
199	16	2026-04-02 00:00:00	1800	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ	312309199929	40802810600004213623	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000410 от 01 апреля 2026 г.б НДС не облагается	102	{СЧ-000410}	matched	2026-04-02 10:29:49.268	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Код": "0", "Дата": "02.04.2026", "Номер": "16", "ОКАТО": "", "Сумма": "1800", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312309199929", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600004213623", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000410 от 01 апреля 2026 г.б НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600004213623", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.269
196	16	2026-04-01 00:00:00	900	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ	310261068777	40802810700005941153	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000433 НДС не облагается	106	{СЧ-000433}	matched	2026-04-02 10:29:49.26	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Код": "0", "Дата": "01.04.2026", "Номер": "16", "ОКАТО": "", "Сумма": "900", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310261068777", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810700005941153", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000433 НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810700005941153", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.261
197	127	2026-04-01 00:00:00	5250	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА	311301471962	40802810600002105267	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Счет на оплату № СЧ-000423 от 01 апреля 2026 г. НДС не облагается	55	{СЧ-000423}	matched	2026-04-02 10:29:49.263	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Дата": "01.04.2026", "Номер": "127", "ОКАТО": "", "Сумма": "5250", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "01.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "311301471962", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600002105267", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000423 от 01 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600002105267", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.264
200	17	2026-04-02 00:00:00	1800	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ	312309199929	40802810600004213623	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000429 от 01 апреля 2026 г. НДС не облагается	102	{СЧ-000429}	matched	2026-04-02 10:29:49.271	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Код": "0", "Дата": "02.04.2026", "Номер": "17", "ОКАТО": "", "Сумма": "1800", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312309199929", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600004213623", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000429 от 01 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600004213623", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.272
201	18	2026-04-02 00:00:00	990	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ	312309199929	40802810600004213623	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000395 от 01 апреля 2026 г. НДС не облагается	102	{СЧ-000395}	matched	2026-04-02 10:29:49.274	5136c727-c55e-4e0f-b94f-4ee82bd25818	{"Код": "0", "Дата": "02.04.2026", "Номер": "18", "ОКАТО": "", "Сумма": "990", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МОРДВИЧЕВ РУСЛАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "02.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312309199929", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600004213623", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000395 от 01 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600004213623", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-02 10:29:49.274
286	69017	2026-04-03 00:00:00	13300	incoming	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	40802810420000471257	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	без НДС	105	{}	matched	2026-04-06 10:37:54.535	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "03.04.2026", "Номер": "69017", "ОКАТО": "", "Сумма": "13300", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Иньяков Максим Андреевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "03.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "311702951839", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810420000471257", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810420000471257", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.537
295	446	2026-04-06 00:00:00	7450	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Москва счёт № 4136814232 от 06 апреля 2026 г. НДС не облагается.	56	{4136814232}	matched	2026-04-06 10:37:54.563	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "06.04.2026", "Номер": "446", "ОКАТО": "", "Сумма": "7450", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Москва счёт № 4136814232 от 06 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.564
296	201	2026-04-06 00:00:00	59000	incoming	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЕВРО СПРЕЙ"	3123460003	40702810600990002310	044525176	ПАО АКБ "Металлинвестбанк"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата счетов 212, 247, 287, 313, 350, 366 за март с 23.03 по 31.03, и 449, 452, 501 и 502 с 01 по 03 апреля 2026г (транспортные расходы). Без НДС	29	{}	matched	2026-04-06 10:37:54.566	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "06.04.2026", "Номер": "201", "ОКАТО": "", "Сумма": "59000", "ВидОплаты": "01", "Плательщик": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \\"ЕВРО СПРЕЙ\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525176", "ПлательщикИНН": "3123460003", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810600990002310", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"Металлинвестбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата счетов 212, 247, 287, 313, 350, 366 за март с 23.03 по 31.03, и 449, 452, 501 и 502 с 01 по 03 апреля 2026г (транспортные расходы). Без НДС", "ПлательщикКорсчет": "30101810300000000176", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810600990002310", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.568
297	52	2026-04-06 00:00:00	4040	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000519 от 06 апреля 2026 г. без НДС	33	{СЧ-000519}	matched	2026-04-06 10:37:54.569	26c5919f-6c0a-463e-865e-54746501a3e6	{"Дата": "06.04.2026", "Номер": "52", "ОКАТО": "", "Сумма": "4040", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000519 от 06 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.57
298	46	2026-04-06 00:00:00	200	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ	312006684524	40802810100005266603	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000522 от 06 апреля 2026 г. НДС не облагается	51	{СЧ-000522}	matched	2026-04-06 10:37:54.572	26c5919f-6c0a-463e-865e-54746501a3e6	{"Код": "0", "Дата": "06.04.2026", "Номер": "46", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГУЗЕНКО СЕРГЕЙ АНДРЕЕВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312006684524", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810100005266603", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000522 от 06 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810100005266603", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-06 10:37:54.573
310	369838	2026-04-06 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000520 от 06 апреля 2026 г. НДС не облагается	38	{СЧ-000520}	matched	2026-04-09 17:15:01.336	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "06.04.2026", "Номер": "369838", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000520 от 06 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.337
311	141	2026-04-06 00:00:00	8750	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000390 от 01 апреля 2026 г.	73	{СЧ-000390}	matched	2026-04-09 17:15:01.346	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "06.04.2026", "Номер": "141", "ОКАТО": "", "Сумма": "8750", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000390 от 01 апреля 2026 г.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.347
312	14	2026-04-06 00:00:00	900	incoming	ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)	310209286941	40802810681170000209	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000532 от 06 апреля 2026 г. НДС не облагается	39	{СЧ-000532}	matched	2026-04-09 17:15:01.35	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "06.04.2026", "Номер": "14", "ОКАТО": "", "Сумма": "900", "ВидОплаты": "01", "Плательщик": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "310209286941", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810681170000209", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000532 от 06 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810681170000209", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.351
313	46	2026-04-06 00:00:00	950	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ	312328906299	40802810307000105515	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000495 от 03 апреля 2026 г.	88	{СЧ-000495}	matched	2026-04-09 17:15:01.354	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "06.04.2026", "Номер": "46", "ОКАТО": "", "Сумма": "950", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312328906299", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810307000105515", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000495 от 03 апреля 2026 г.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810307000105515", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.355
314	48	2026-04-06 00:00:00	990	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ	312328906299	40802810307000105515	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000496 от 03 апреля 2026 г.	88	{СЧ-000496}	matched	2026-04-09 17:15:01.358	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "06.04.2026", "Номер": "48", "ОКАТО": "", "Сумма": "990", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОЛУБОВ АЛЕКСАНДР НИКОЛАЕВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312328906299", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810307000105515", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000496 от 03 апреля 2026 г.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810307000105515", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.359
315	255	2026-04-06 00:00:00	2920	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА	312313448504	40802810107000022416	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата за транспортные услуги по счету № СЧ-000440 , №000441, и №000442 от 02.04.26. НДС не облагается.	112	{СЧ-000440,000441,000442}	matched	2026-04-09 17:15:01.362	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "06.04.2026", "Номер": "255", "ОКАТО": "", "Сумма": "2920", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЕТМАНЦЕВА НИНА СЕРГЕЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "06.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312313448504", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000022416", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по счету № СЧ-000440 , №000441, и №000442 от 02.04.26. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000022416", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.364
316	74	2026-04-07 00:00:00	14300	incoming	СЕРГИЕНКО АЛЕКСАНДР СЕРГЕЕВИЧ (ИП)	312328441893	40802810502680001013	044525593	АО "АЛЬФА-БАНК"	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Счет на оплату № 4136814230 от 06 апреля 2026 г. НДС не облагается	\N	{4136814230}	unmatched	\N	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "07.04.2026", "Номер": "74", "ОКАТО": "", "Сумма": "14300", "ВидОплаты": "01", "Плательщик": "СЕРГИЕНКО АЛЕКСАНДР СЕРГЕЕВИЧ (ИП)", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "СЕРГИЕНКО АЛЕКСАНДР СЕРГЕЕВИЧ (ИП)", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312328441893", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810502680001013", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № 4136814230 от 06 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810502680001013", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.368
317	54	2026-04-07 00:00:00	300	incoming	Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ	312302984310	40802810811680002018	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету СЧ-000545 от 06.04.2026 г. . за транспортные услуги. НДС не облагается	35	{СЧ-000545}	matched	2026-04-09 17:15:01.371	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "54", "ОКАТО": "", "Сумма": "300", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312302984310", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810811680002018", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000545 от 06.04.2026 г. . за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810811680002018", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.372
318	8	2026-04-07 00:00:00	800	incoming	Индивидуальный предприниматель Чеботенко Евгения Александровна	312730946335	40802810120000151738	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000206 от 23 марта 2026 без НДС	69	{СЧ-000206}	matched	2026-04-09 17:15:01.375	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "8", "ОКАТО": "", "Сумма": "800", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312730946335", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810120000151738", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000206 от 23 марта 2026 без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810120000151738", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.376
319	10	2026-04-07 00:00:00	940	incoming	Индивидуальный предприниматель Чеботенко Евгения Александровна	312730946335	40802810120000151738	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000337 от 27 марта 2026 г. без НДС	69	{СЧ-000337}	matched	2026-04-09 17:15:01.379	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "10", "ОКАТО": "", "Сумма": "940", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312730946335", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810120000151738", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000337 от 27 марта 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810120000151738", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.38
320	11	2026-04-07 00:00:00	790	incoming	Индивидуальный предприниматель Чеботенко Евгения Александровна	312730946335	40802810120000151738	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000407 от 01 апреля 2026 г. без НДС	69	{СЧ-000407}	matched	2026-04-09 17:15:01.383	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "11", "ОКАТО": "", "Сумма": "790", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312730946335", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810120000151738", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000407 от 01 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810120000151738", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.384
321	9	2026-04-07 00:00:00	850	incoming	Индивидуальный предприниматель Чеботенко Евгения Александровна	312730946335	40802810120000151738	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000207 от 23 марта 2026 без НДС	69	{СЧ-000207}	matched	2026-04-09 17:15:01.387	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "9", "ОКАТО": "", "Сумма": "850", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Чеботенко Евгения Александровна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312730946335", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810120000151738", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000207 от 23 марта 2026 без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810120000151738", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.388
322	104	2026-04-07 00:00:00	19730	incoming	ООО "ЗЕЛЕНЫЙ МИР"	3123218073	40702810209740002466	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по счету №666 от 01.04.26г .№СЧ484 от 03.04.2026г. №СЧ517 от 06.04.26г. Сумма 19730-00 Без налога (НДС)	104	{666,СЧ484,СЧ517}	matched	2026-04-09 17:15:01.391	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "104", "ОКАТО": "", "Сумма": "19730", "ВидОплаты": "01", "Плательщик": "ООО \\"ЗЕЛЕНЫЙ МИР\\"", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ООО \\"ЗЕЛЕНЫЙ МИР\\"", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "07.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "3123218073", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810209740002466", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по счету №666 от 01.04.26г .№СЧ484 от 03.04.2026г. №СЧ517 от 06.04.26г. Сумма 19730-00 Без налога (НДС)", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810209740002466", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.393
323	901692	2026-04-07 00:00:00	2063	incoming	ПАО СБЕРБАНК//АУЛОВА ЕЛЕНА НИКОЛАЕВНА//7510598505992//308518, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П НОВОСАДОВЫЙ, УЛ 1-Я ВЕРБНАЯ (МКР НОВОСАДОВЫЙ), Д 9//	7707083893	30233810642000600001	042202603	ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК	ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	с 1-6 апреля включительно;07/04/2026	\N	{}	unmatched	\N	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "07.04.2026", "Номер": "901692", "ОКАТО": "", "Сумма": "2063", "ВидОплаты": "01", "Плательщик": "ПАО СБЕРБАНК//АУЛОВА ЕЛЕНА НИКОЛАЕВНА//7510598505992//308518, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П НОВОСАДОВЫЙ, УЛ 1-Я ВЕРБНАЯ (МКР НОВОСАДОВЫЙ), Д 9//", "Получатель": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ПАО СБЕРБАНК//АУЛОВА ЕЛЕНА НИКОЛАЕВНА//7510598505992//308518, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П НОВОСАДОВЫЙ, УЛ 1-Я ВЕРБНАЯ (МКР НОВОСАДОВЫЙ), Д 9//", "Получатель1": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "042202603", "ПлательщикИНН": "7707083893", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "30233810642000600001", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "с 1-6 апреля включительно;07/04/2026", "ПлательщикКорсчет": "30101810900000000603", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30233810642000600001", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.4
324	157	2026-04-08 00:00:00	2550	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000482 от 03 апреля 2026 г. без НДС	52	{СЧ-000482}	matched	2026-04-09 17:15:01.405	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "157", "ОКАТО": "", "Сумма": "2550", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000482 от 03 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.406
325	156	2026-04-08 00:00:00	660	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000480 от 03 апреля 2026 г. без НДС	52	{СЧ-000480}	matched	2026-04-09 17:15:01.409	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "156", "ОКАТО": "", "Сумма": "660", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000480 от 03 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.41
326	158	2026-04-08 00:00:00	4750	incoming	Индивидуальный предприниматель Калачев Дмитрий Сергеевич	781430735672	40802810803500008381	044525104	ООО "Банк Точка"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Счет на оплату № СЧ-000483 от 03 апреля 2026 г. без НДС	52	{СЧ-000483}	matched	2026-04-09 17:15:01.414	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "158", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Калачев Дмитрий Сергеевич", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "781430735672", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810803500008381", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Счет на оплату № СЧ-000483 от 03 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810803500008381", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.415
332	100	2026-04-09 00:00:00	4300	incoming	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	40802810370010393288	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000635 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС	87	{СЧ-000635}	matched	2026-04-09 17:15:01.438	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "09.04.2026", "Номер": "100", "ОКАТО": "", "Сумма": "4300", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "312320726304", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810370010393288", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000635 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810370010393288", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.44
333	102	2026-04-09 00:00:00	840	incoming	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	40802810370010393288	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000648 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург. НДС не облагается. Без НДС	87	{СЧ-000648}	matched	2026-04-09 17:15:01.442	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "09.04.2026", "Номер": "102", "ОКАТО": "", "Сумма": "840", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "312320726304", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810370010393288", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000648 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург. НДС не облагается. Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810370010393288", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.444
334	57	2026-04-09 00:00:00	1720	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000619 от 09 апреля 2026 г. без НДС	33	{СЧ-000619}	matched	2026-04-09 17:15:01.447	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "57", "ОКАТО": "", "Сумма": "1720", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000619 от 09 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.448
327	8	2026-04-08 00:00:00	200	incoming	Индивидуальный предприниматель Скворцов Евгений Валерьевич	312772503303	40802810020000183411	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000528 от 06 апреля 2026 г. без НДС	32	{СЧ-000528}	matched	2026-04-09 17:15:01.418	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "8", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Скворцов Евгений Валерьевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Скворцов Евгений Валерьевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312772503303", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810020000183411", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000528 от 06 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810020000183411", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.419
328	7	2026-04-08 00:00:00	200	incoming	Индивидуальный предприниматель Скворцов Евгений Валерьевич	312772503303	40802810020000183411	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000526 от 06 апреля 2026 г. без НДС	32	{СЧ-000526}	matched	2026-04-09 17:15:01.422	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "7", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Скворцов Евгений Валерьевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Скворцов Евгений Валерьевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312772503303", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810020000183411", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000526 от 06 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810020000183411", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.423
329	287550	2026-04-08 00:00:00	4750	incoming	БАБИНОВА ЮЛИЯ НИКОЛАЕВНА	312334464306	40817810100047388123	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *0046, Оплата по счету №СЧ-000602 от 08 апреля 2026 г. НДС не облагается	36	{СЧ-000602}	matched	2026-04-09 17:15:01.426	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "08.04.2026", "Номер": "287550", "ОКАТО": "", "Сумма": "4750", "ВидОплаты": "01", "Плательщик": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "БАБИНОВА ЮЛИЯ НИКОЛАЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "08.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312334464306", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810100047388123", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *0046, Оплата по счету №СЧ-000602 от 08 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810100047388123", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.427
330	19	2026-04-09 00:00:00	750	incoming	Индивидуальный предприниматель Чаусова Юлия Геннадьевна	312323052364	40802810201500474151	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000646 от 09 апреля 2026 г. без НДС	72	{СЧ-000646}	matched	2026-04-09 17:15:01.43	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "19", "ОКАТО": "", "Сумма": "750", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Чаусова Юлия Геннадьевна", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Чаусова Юлия Геннадьевна", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "312323052364", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810201500474151", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000646 от 09 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810201500474151", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.431
331	17	2026-04-09 00:00:00	7200	incoming	МОРОЗ НАТАЛЬЯ ЕВГЕНЬЕВНА (ИП)	310206531049	40802810301980005237	044525593	АО "АЛЬФА-БАНК"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814046 от 13 февраля 2026 г. № 4136814124 от 04 марта 2026 г. НДС не облагается	89	{4136814046,4136814124}	matched	2026-04-09 17:15:01.434	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "09.04.2026", "Номер": "17", "ОКАТО": "", "Сумма": "7200", "ВидОплаты": "01", "Плательщик": "МОРОЗ НАТАЛЬЯ ЕВГЕНЬЕВНА (ИП)", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "МОРОЗ НАТАЛЬЯ ЕВГЕНЬЕВНА (ИП)", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "310206531049", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810301980005237", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814046 от 13 февраля 2026 г. № 4136814124 от 04 марта 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810301980005237", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.435
335	101	2026-04-09 00:00:00	1100	incoming	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	40802810370010393288	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № СЧ-000647 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Сарапул. НДС не облагается. Без НДС	87	{СЧ-000647}	matched	2026-04-09 17:15:01.451	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Код": "0", "Дата": "09.04.2026", "Номер": "101", "ОКАТО": "", "Сумма": "1100", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "312320726304", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810370010393288", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № СЧ-000647 от 09.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Сарапул. НДС не облагается. Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810370010393288", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.452
336	15	2026-04-09 00:00:00	450	incoming	ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)	310209286941	40802810681170000209	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000623 от 09 апреля 2026 г. НДС не облагается	39	{СЧ-000623}	matched	2026-04-09 17:15:01.455	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "15", "ОКАТО": "", "Сумма": "450", "ВидОплаты": "01", "Плательщик": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "310209286941", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810681170000209", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000623 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810681170000209", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.457
337	56	2026-04-09 00:00:00	1000	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000618 от 09 апреля 2026 г. без НДС	33	{СЧ-000618}	matched	2026-04-09 17:15:01.459	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "56", "ОКАТО": "", "Сумма": "1000", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000618 от 09 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.461
342	38	2026-04-09 00:00:00	1980	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА	621403086153	40802810353000039113	046126614	РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ А. А.	302201915296	40802810100002843508	НДС не облагается.	42	{}	matched	2026-04-09 17:15:01.482	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "38", "ОКАТО": "", "Сумма": "1980", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель": "ИП СОЛОВЬЕВ А. А.", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель1": "ИП СОЛОВЬЕВ А. А.", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "046126614", "ПлательщикИНН": "621403086153", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810353000039113", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "НДС не облагается.", "ПлательщикКорсчет": "30101810500000000614", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810353000039113", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.484
343	39	2026-04-09 00:00:00	990	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА	621403086153	40802810353000039113	046126614	РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ А. А.	302201915296	40802810100002843508	НДС не облагается.	42	{}	matched	2026-04-09 17:15:01.486	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "39", "ОКАТО": "", "Сумма": "990", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель": "ИП СОЛОВЬЕВ А. А.", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КАТИЛОГЛЫ НАТАЛЬЯ ВЛАДИМИРОВНА", "Получатель1": "ИП СОЛОВЬЕВ А. А.", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "046126614", "ПлательщикИНН": "621403086153", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810353000039113", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "РЯЗАНСКОЕ ОТДЕЛЕНИЕ N 8606 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "НДС не облагается.", "ПлательщикКорсчет": "30101810500000000614", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810353000039113", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.487
338	58	2026-04-09 00:00:00	5500	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000652 от 09 апреля 2026 г. без НДС	33	{СЧ-000652}	matched	2026-04-09 17:15:01.467	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "58", "ОКАТО": "", "Сумма": "5500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000652 от 09 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.469
339	55	2026-04-09 00:00:00	1040	incoming	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	40802810220000535199	044525104	ООО "Банк Точка"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000617 от 09 апреля 2026 г. без НДС	33	{СЧ-000617}	matched	2026-04-09 17:15:01.471	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "55", "ОКАТО": "", "Сумма": "1040", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "Индивидуальный предприниматель Волобуев Дмитрий Сергеевич", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525104", "ПлательщикИНН": "461400229170", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810220000535199", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"Банк Точка\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000617 от 09 апреля 2026 г. без НДС", "ПлательщикКорсчет": "30101810745374525104", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810220000535199", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.472
340	464	2026-04-09 00:00:00	2850	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Коледино счёт № СЧ-000643 от 09 апреля 2026 НДС не облагается.	56	{СЧ-000643}	matched	2026-04-09 17:15:01.475	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "464", "ОКАТО": "", "Сумма": "2850", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Коледино счёт № СЧ-000643 от 09 апреля 2026 НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.476
341	465	2026-04-09 00:00:00	5580	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург счёт № СЧ-000651 от 09 апреля 2026 НДС не облагается.	56	{СЧ-000651}	matched	2026-04-09 17:15:01.479	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "465", "ОКАТО": "", "Сумма": "5580", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург счёт № СЧ-000651 от 09 апреля 2026 НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.48
345	16	2026-04-09 00:00:00	650	incoming	ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)	310209286941	40802810681170000209	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000660 от 09 апреля 2026 г. НДС не облагается	39	{СЧ-000660}	matched	2026-04-09 17:15:01.493	3cb64923-564d-4f0b-9566-ccd8333f4f1c	{"Дата": "09.04.2026", "Номер": "16", "ОКАТО": "", "Сумма": "650", "ВидОплаты": "01", "Плательщик": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАЙЦЕВА НАТАЛЬЯ АЛЕКСАНДРОВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "310209286941", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810681170000209", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000660 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810681170000209", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-09 17:15:01.495
373	146	2026-04-10 00:00:00	8125	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000487 от 03 апреля 2026 г.	73	{СЧ-000487}	matched	2026-04-13 07:52:27.952	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "10.04.2026", "Номер": "146", "ОКАТО": "", "Сумма": "8125", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000487 от 03 апреля 2026 г.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.953
374	148	2026-04-10 00:00:00	4830	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000717 от 10 апреля 2026 г.	73	{СЧ-000717}	matched	2026-04-13 07:52:27.955	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "10.04.2026", "Номер": "148", "ОКАТО": "", "Сумма": "4830", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000717 от 10 апреля 2026 г.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.956
362	67190	2026-04-09 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000626 от 09 апреля 2026 г. НДС не облагается	38	{СЧ-000626}	matched	2026-04-13 07:52:27.925	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "09.04.2026", "Номер": "67190", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000626 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.926
363	13866	2026-04-09 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000627 от 09 апреля 2026 г. НДС не облагается	38	{СЧ-000627}	matched	2026-04-13 07:52:27.93	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "09.04.2026", "Номер": "13866", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000627 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.931
364	90220	2026-04-09 00:00:00	200	incoming	ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40817810300028119234	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод с карты *4295, Оплата по счету №СЧ-000628 от 09 апреля 2026 г. НДС не облагается	38	{СЧ-000628}	matched	2026-04-13 07:52:27.932	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "09.04.2026", "Номер": "90220", "ОКАТО": "", "Сумма": "200", "ВидОплаты": "01", "Плательщик": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "09.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40817810300028119234", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод с карты *4295, Оплата по счету №СЧ-000628 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810300028119234", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.933
365	489225	2026-04-09 00:00:00	288	incoming	ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443854421//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//	7707083893	30233810642000600001	042202603	ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК	ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	ОПЛАТА ПО СЧЕТУ №СЧ-000656 ОТ 09 АПРЕЛЯ 2026 Г.;09/04/2026	\N	{СЧ-000656}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "09.04.2026", "Номер": "489225", "ОКАТО": "", "Сумма": "288", "ВидОплаты": "01", "Плательщик": "ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443854421//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//", "Получатель": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443854421//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//", "Получатель1": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "042202603", "ПлательщикИНН": "7707083893", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "30233810642000600001", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "ОПЛАТА ПО СЧЕТУ №СЧ-000656 ОТ 09 АПРЕЛЯ 2026 Г.;09/04/2026", "ПлательщикКорсчет": "30101810900000000603", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30233810642000600001", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.935
366	488912	2026-04-09 00:00:00	600	incoming	ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443603576//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//	7707083893	30233810642000600001	042202603	ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК	ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	ОПЛАТА ПО СЧЕТУ №СЧ-000533 ОТ 06 АПРЕЛЯ 2026 Г.;09/04/2026	\N	{СЧ-000533}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "09.04.2026", "Номер": "488912", "ОКАТО": "", "Сумма": "600", "ВидОплаты": "01", "Плательщик": "ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443603576//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//", "Получатель": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ПАО СБЕРБАНК//АВИЛОВА ЮЛИЯ СЕРГЕЕВНА//7512443603576//308501, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, БЕЛГОРОДСКИЙ Р-Н, П ДУБОВОЕ, КВ-Л N1 (МКР УЛИТКА), Д 5 КВ 104//", "Получатель1": "ИП СОЛОВЬЁВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "042202603", "ПлательщикИНН": "7707083893", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "30233810642000600001", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ВОЛГО-ВЯТСКИЙ БАНК ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "ОПЛАТА ПО СЧЕТУ №СЧ-000533 ОТ 06 АПРЕЛЯ 2026 Г.;09/04/2026", "ПлательщикКорсчет": "30101810900000000603", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30233810642000600001", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.937
367	149	2026-04-10 00:00:00	14100	incoming	ООО "СТИЛБУРГ"	3123477247	40702810425100031982	044525201	ПАО АКБ "АВАНГАРД"	СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)	302201915296	40802810100002843508	Оплата по счету № СЧ-000641 от 09.04.2026 г. за транспортные и разгрузочные услуги.   Сумма 14100.00, НДС не облагается	98	{СЧ-000641}	matched	2026-04-13 07:52:27.939	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "149", "ОКАТО": "", "Сумма": "14100", "ВидОплаты": "01", "Плательщик": "ООО \\"СТИЛБУРГ\\"", "Получатель": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Плательщик1": "ООО \\"СТИЛБУРГ\\"", "Получатель1": "СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ (ИП)", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525201", "ПлательщикИНН": "3123477247", "ПлательщикКПП": "312301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40702810425100031982", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ПАО АКБ \\"АВАНГАРД\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету № СЧ-000641 от 09.04.2026 г. за транспортные и разгрузочные услуги.   Сумма 14100.00, НДС не облагается", "ПлательщикКорсчет": "30101810000000000201", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40702810425100031982", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.939
368	471	2026-04-10 00:00:00	12070	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000657 от 09 апреля 2026 г. НДС не облагается.	56	{СЧ-000657}	matched	2026-04-13 07:52:27.941	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "471", "ОКАТО": "", "Сумма": "12070", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услуги по маршруту г. Белгород - г. Тула счёт № СЧ-000657 от 09 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.941
369	19	2026-04-10 00:00:00	900	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ	310261068777	40802810700005941153	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000714 от 10 апреля 2026 г. НДС не облагается	106	{СЧ-000714}	matched	2026-04-13 07:52:27.943	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "10.04.2026", "Номер": "19", "ОКАТО": "", "Сумма": "900", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НЕМИНУЩИЙ АЛЕКСАНДР ВЛАДИМИРОВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310261068777", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810700005941153", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТИНЬКОФФ БАНК\\" Г. Москва", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000714 от 10 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810700005941153", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.944
370	477	2026-04-10 00:00:00	5930	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА	312303413735	40802810107000008935	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьев Артём Александрович	302201915296	40802810100002843508	Оплата за транспортные услугиСЧ-000711 от 10 апреля 2026 г.СЧ-000657 от 09 апреля 2026 г. НДС не облагается.	56	{СЧ-000711,СЧ-000657}	matched	2026-04-13 07:52:27.945	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "477", "ОКАТО": "", "Сумма": "5930", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель": "ИП Соловьев Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МИНАКОВА МАРИНА ВИКТОРОВНА", "Получатель1": "ИП Соловьев Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312303413735", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810107000008935", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата за транспортные услугиСЧ-000711 от 10 апреля 2026 г.СЧ-000657 от 09 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810107000008935", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.945
371	36	2026-04-10 00:00:00	4450	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА	312335137904	40802810607000057059	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000721 от 10 апреля 2026 г. НДС не облагается.	132	{СЧ-000721}	matched	2026-04-13 07:52:27.946	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "36", "ОКАТО": "", "Сумма": "4450", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛЕВШИНА АНАСТАСИЯ ГЕННАДИЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312335137904", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810607000057059", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000721 от 10 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810607000057059", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.947
372	147	2026-04-10 00:00:00	1600	incoming	ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)	312333020202	40802810901620003025	044525593	АО "АЛЬФА-БАНК"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000682 от 10 апреля 2026 г.	73	{СЧ-000682}	matched	2026-04-13 07:52:27.948	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "10.04.2026", "Номер": "147", "ОКАТО": "", "Сумма": "1600", "ВидОплаты": "01", "Плательщик": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ЗАКУСИЛО АЛЕКСАНДРА СЕРГЕЕВНА (ИП)", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525593", "ПлательщикИНН": "312333020202", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810901620003025", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"АЛЬФА-БАНК\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000682 от 10 апреля 2026 г.", "ПлательщикКорсчет": "30101810200000000593", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810901620003025", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.95
381	785157	2026-04-11 00:00:00	9109.23	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 10.04.2026. Сумма комиссии 280 руб. 77 коп. НДС не облагается.	\N	{}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "11.04.2026", "Номер": "785157", "ОКАТО": "", "Сумма": "9109.23", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 10.04.2026. Сумма комиссии 280 руб. 77 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.97
382	104	2026-04-11 00:00:00	36710	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ	312332151900	40802810600006217216	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата услуг В т.ч. НДС 0% - 0 руб	71	{}	matched	2026-04-13 07:52:27.971	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "11.04.2026", "Номер": "104", "ОКАТО": "", "Сумма": "36710", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГАВРИЛОВ РОМАН ВЯЧЕСЛАВОВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "312332151900", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600006217216", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата услуг В т.ч. НДС 0% - 0 руб", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600006217216", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.972
383	351383	2026-04-12 00:00:00	960.4	incoming	АО "ТБанк"	7710140679	30232810200000185997	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 11.04.2026. Сумма комиссии 29 руб. 60 коп. НДС не облагается.	\N	{}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "12.04.2026", "Номер": "351383", "ОКАТО": "", "Сумма": "960.4", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810200000185997", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Перевод средств по договору 7037474041 от 23.08.2021г. (Solovyov-express) по реестру операций от 11.04.2026. Сумма комиссии 29 руб. 60 коп. НДС не облагается.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810200000185997", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.973
375	22	2026-04-10 00:00:00	1780	incoming	Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА	310900893545	40802810200810075730	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814234 от 10.04.26. НДС не облагается - 1780.00 руб. В т.ч. НДС 22% - 320,98 руб.	\N	{4136814234}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "22", "ОКАТО": "", "Сумма": "1780", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ДОКУКИНА АННА ВАСИЛЬЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "310900893545", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810200810075730", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814234 от 10.04.26. НДС не облагается - 1780.00 руб. В т.ч. НДС 22% - 320,98 руб.", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810200810075730", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.958
376	104	2026-04-10 00:00:00	4500	incoming	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	40802810370010393288	044525092	Московский Филиал АО КБ "Модульбанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814236 от 10.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС	87	{4136814236}	matched	2026-04-13 07:52:27.959	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Код": "0", "Дата": "10.04.2026", "Номер": "104", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель Астапов Денис Владимирович", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525092", "ПлательщикИНН": "312320726304", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810370010393288", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Московский Филиал АО КБ \\"Модульбанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814236 от 10.04.26 г. за транспортные услуги по маршруту г. Белгород - г. Курск. НДС не облагается. Без НДС", "ПлательщикКорсчет": "30101810645250000092", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810370010393288", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.96
377	972288	2026-04-10 00:00:00	5650	incoming	АО "ТБанк"	7710140679	30232810600003197537	044525974	АО "ТБанк"	Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Пополнение по операции СБП 8304873848. Терминал Solovyov-express	\N	{}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "972288", "ОКАТО": "", "Сумма": "5650", "ВидОплаты": "17", "Плательщик": "АО \\"ТБанк\\"", "Получатель": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Плательщик1": "АО \\"ТБанк\\"", "Получатель1": "Индивидуальный предприниматель СОЛОВЬЕВ АРТЕМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "7710140679", "ПлательщикКПП": "771301001", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "30232810600003197537", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Пополнение по операции СБП 8304873848. Терминал Solovyov-express", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "30232810600003197537", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.962
378	26	2026-04-10 00:00:00	13250	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ФУРЦЕВ РУСЛАН ВЛАДИМИРОВИЧ	312301447915	40802810307000052354	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814238 от 10.04.26. НДС не облагается. - 13250.00 руб.	\N	{4136814238}	unmatched	\N	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "26", "ОКАТО": "", "Сумма": "13250", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ФУРЦЕВ РУСЛАН ВЛАДИМИРОВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ФУРЦЕВ РУСЛАН ВЛАДИМИРОВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312301447915", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810307000052354", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814238 от 10.04.26. НДС не облагается. - 13250.00 руб.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810307000052354", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.964
379	36	2026-04-10 00:00:00	260	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ	310263763374	40802810300002307873	044525974	АО "ТБанк"	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000667 от 09 апреля 2026 г. НДС не облагается	38	{СЧ-000667}	matched	2026-04-13 07:52:27.965	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "36", "ОКАТО": "", "Сумма": "260", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГОНЧАР ОЛЕГ СЕРГЕЕВИЧ", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "310263763374", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810300002307873", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000667 от 09 апреля 2026 г. НДС не облагается", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810300002307873", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.966
380	142	2026-04-10 00:00:00	4500	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА	311301471962	40802810600002105267	044525974	АО "ТБанк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814237 от 10.04.26. НДС не облагается - 4500.00 руб.	55	{4136814237}	matched	2026-04-13 07:52:27.967	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "10.04.2026", "Номер": "142", "ОКАТО": "", "Сумма": "4500", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЕЛЕШЕНКО АНАСТАСИЯ ГЕННАДЬЕВНА", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "10.04.2026", "ПлательщикБИК": "044525974", "ПлательщикИНН": "311301471962", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "0", "ПлательщикСчет": "40802810600002105267", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "АО \\"ТБанк\\"", "ПолучательБанк1": "АО \\"ТБАНК\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814237 от 10.04.26. НДС не облагается - 4500.00 руб.", "ПлательщикКорсчет": "30101810145250000974", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810600002105267", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.968
384	168	2026-04-12 00:00:00	7150	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА	312330492180	40802810507000105933	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000500 от 03 апреля 2026 г. НДС не облагается.	49	{СЧ-000500}	matched	2026-04-13 07:52:27.974	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "12.04.2026", "Номер": "168", "ОКАТО": "", "Сумма": "7150", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312330492180", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810507000105933", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000500 от 03 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810507000105933", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.975
385	166	2026-04-12 00:00:00	15750	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА	312330492180	40802810507000105933	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000391 от 01 апреля 2026 г. НДС не облагается.	49	{СЧ-000391}	matched	2026-04-13 07:52:27.976	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "12.04.2026", "Номер": "166", "ОКАТО": "", "Сумма": "15750", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312330492180", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810507000105933", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000391 от 01 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810507000105933", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.977
386	167	2026-04-12 00:00:00	4350	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА	312330492180	40802810507000105933	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000493 от 03 апреля 2026 г. НДС не облагается.	49	{СЧ-000493}	matched	2026-04-13 07:52:27.978	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "12.04.2026", "Номер": "167", "ОКАТО": "", "Сумма": "4350", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЛАГУТИНА ЕЛЕНА НИКОЛАЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312330492180", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810507000105933", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000493 от 03 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810507000105933", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.979
387	12	2026-04-13 00:00:00	950	incoming	Борисова Ксения Олеговна	312328826815	40817810400015060324	044525068	ООО "ОЗОН Банк"	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Платеж по счету № 4136814242 от 10.04.26. НДС не облагается - 950.00 руб.	164	{4136814242}	matched	2026-04-13 07:52:27.98	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "13.04.2026", "Номер": "12", "ОКАТО": "", "Сумма": "950", "ВидОплаты": "01", "Плательщик": "Борисова Ксения Олеговна", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Борисова Ксения Олеговна", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "044525068", "ПлательщикИНН": "312328826815", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40817810400015060324", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "ООО \\"ОЗОН Банк\\"", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Платеж по счету № 4136814242 от 10.04.26. НДС не облагается - 950.00 руб.", "ПлательщикКорсчет": "30101810645374525068", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40817810400015060324", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.981
388	58	2026-04-13 00:00:00	2200	incoming	Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ	312302984310	40802810811680002018	044525411	Филиал "Центральный" Банка ВТБ (ПАО)	ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ	302201915296	40802810100002843508	Оплата по счету СЧ-000665 от 09.04.2026 г. . за транспортные услуги. НДС не облагается	35	{СЧ-000665}	matched	2026-04-13 07:52:27.982	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "13.04.2026", "Номер": "58", "ОКАТО": "", "Сумма": "2200", "ВидОплаты": "01", "Плательщик": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Плательщик1": "Индивидуальный предприниматель ТЕТЮХИН ОЛЕГ ЮРЬЕВИЧ", "Получатель1": "ИП СОЛОВЬЕВ АРТЁМ АЛЕКСАНДРОВИЧ", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "044525411", "ПлательщикИНН": "312302984310", "ПлательщикКПП": "", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810811680002018", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "Филиал \\"Центральный\\" Банка ВТБ (ПАО)", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету СЧ-000665 от 09.04.2026 г. . за транспортные услуги. НДС не облагается", "ПлательщикКорсчет": "30101810145250000411", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810811680002018", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.982
389	89	2026-04-13 00:00:00	13542	incoming	ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА	312336675817	40802810007000072553	041403633	БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК	ИП Соловьёв Артём Александрович	302201915296	40802810100002843508	Оплата по счету №СЧ-000726 от 10 апреля 2026 г. НДС не облагается.	57	{СЧ-000726}	matched	2026-04-13 07:52:27.983	d8f450d1-b89a-44dc-9f38-14c37416b3b8	{"Дата": "13.04.2026", "Номер": "89", "ОКАТО": "", "Сумма": "13542", "ВидОплаты": "01", "Плательщик": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА", "Получатель": "ИП Соловьёв Артём Александрович", "Плательщик1": "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КУХАРЕВА КРИСТИНА ИГОРЕВНА", "Получатель1": "ИП Соловьёв Артём Александрович", "Очередность": "5", "ДатаПоступило": "13.04.2026", "ПлательщикБИК": "041403633", "ПлательщикИНН": "312336675817", "ПлательщикКПП": "0", "ПоказательКБК": "", "ПолучательБИК": "044525974", "ПолучательИНН": "302201915296", "ПолучательКПП": "", "ПлательщикСчет": "40802810007000072553", "ПоказательДаты": "", "ПолучательСчет": "40802810100002843508", "ПлательщикБанк1": "БЕЛГОРОДСКОЕ ОТДЕЛЕНИЕ N8592 ПАО СБЕРБАНК", "ПолучательБанк1": "АО \\"ТБанк\\"", "ПоказательНомера": "", "НазначениеПлатежа": "Оплата по счету №СЧ-000726 от 10 апреля 2026 г. НДС не облагается.", "ПлательщикКорсчет": "30101810100000000633", "ПоказательПериода": "", "ПолучательКорсчет": "30101810145250000974", "СтатусСоставителя": "", "ПлательщикРасчСчет": "40802810007000072553", "ПолучательРасчСчет": "40802810100002843508", "ПоказательОснования": ""}	2026-04-13 07:52:27.984
\.


--
-- Data for Name: box_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.box_types (id, name, max_volume_m3, created_at, updated_at, min_volume_m3, hint) FROM stdin;
1	Маленькая	0.032	2026-02-24 13:32:58.398	2026-04-13 12:12:44.131	0	Объем менее 0,032 м/куб
2	Средняя	0.064	2026-02-24 13:32:58.402	2026-04-13 12:12:44.137	0.032	Объем 0,032 – 0.064 м/куб
3	Большая	0.096	2026-02-24 13:32:58.404	2026-04-13 12:12:44.139	0.064	Объем 0,064 – и более м/куб
83	от 5 до 10 коробок	1	2026-02-26 20:03:33.216	2026-03-16 16:53:09.212	0.5	Доставка свыше 5 коробов до 10 коробов сумма фиксированная *при условии что короб весит не более 20 кг. (11-я коробка в подарок)
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cities (id, short_name, full_name, created_at, updated_at) FROM stdin;
34	WB Курск FBS	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2026-04-08 14:01:52.275	2026-04-08 14:01:52.275
3	WB Подольск	Транспортные услуги по маршруту г. Белгород - г. Подольск	2026-02-18 18:28:08.766	2026-02-26 18:28:37.209
1	WB Тула (Алексин)	Транспортные услуги по маршруту г. Белгород - г. Тула	2026-02-18 16:47:31.451	2026-02-27 11:03:00.271
9	WB Волгоград	Транспортные услуги по маршруту г. Белгород - г. Волгоград	2026-02-20 12:22:54.81	2026-03-12 08:12:28.737
7	WB Воронеж	Транспортные услуги по маршруту г. Белгород - г. Воронеж	2026-02-20 12:22:54.81	2026-03-12 08:12:42.638
5	WB Казань	Транспортные услуги по маршруту г. Белгород - г. Казань	2026-02-20 12:22:54.81	2026-03-12 08:13:22.69
12	WB Коледино	Транспортные услуги по маршруту г. Белгород - г. Коледино	2026-02-20 12:22:54.81	2026-03-12 08:13:33.659
15	WB Котовск	Транспортные услуги по маршруту г. Белгород - г. Котовск	2026-02-20 12:22:54.81	2026-03-12 08:13:49.225
8	WB Краснодар	Транспортные услуги по маршруту г. Белгород - г. Краснодар	2026-02-20 12:22:54.81	2026-03-12 08:14:02.314
10	WB Невинномысск	Транспортные услуги по маршруту г. Белгород - г. Невинномысск	2026-02-20 12:22:54.81	2026-03-12 08:14:13.765
17	WB Электросталь	Транспортные услуги по маршруту г. Белгород - г. Электросталь	2026-02-20 12:22:54.81	2026-03-12 08:14:25.87
4	WB Сарапул	Транспортные услуги по маршруту г. Белгород - г. Сарапул	2026-02-20 12:22:54.81	2026-03-12 08:15:25.782
14	WB Рязань	Транспортные услуги по маршруту г. Белгород - г. Рязань	2026-02-20 12:22:54.81	2026-03-12 08:15:37.052
16	WB Новосемейкино	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино	2026-02-20 12:22:54.81	2026-03-12 08:16:33.464
2	WB Курск	Транспортные услуги по маршруту г. Белгород - г. Курск	2026-02-18 16:47:43.012	2026-03-15 17:05:35.307
24	WB Тест	тест	2026-03-18 11:12:56.789	2026-03-18 11:12:56.789
25	WB Щербинка	Транспортные услуги по маршруту г. Белгород - г. Подольск	2026-03-18 12:55:54.732	2026-03-18 12:55:54.732
13	WB Екатеринбург (Перспективная 14)	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург	2026-02-20 12:22:54.81	2026-03-18 12:59:55.579
27	WB Чехов - 2	Транспортные услуги по маршруту г. Белгород - МО(с. Новосёлки, промышленная зона Новосёлки, вл11с7)	2026-03-18 12:59:10.018	2026-03-18 13:01:36.393
21	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург	2026-03-13 12:51:25.45	2026-03-20 08:49:18.224
29	Lamoda  Софьино	Транспортные услуги по маршруту г. Белгород - МО (Lamoda  Софьино)	2026-03-18 13:09:20.219	2026-03-24 12:24:18.599
28	OZON Софьино	Транспортные услуги по маршруту г. Белгород - МО (OZON Софьино)	2026-03-18 13:08:24.798	2026-03-24 12:24:40.958
31	OZON Домодедово	Транспортные услуги по маршруту г. Белгород - МО (OZON Домодедово)	2026-03-18 13:10:21.151	2026-03-24 12:25:03.231
32	OZON  Пушкино	Транспортные услуги по маршруту г. Белгород - МО (OZON  Пушкино)	2026-03-18 13:10:42.647	2026-03-24 12:25:17.971
33	Яндекс Маркет (Софьино)	Транспортные услуги по маршруту г. Белгород - МО (Яндекс Маркет Софьино)	2026-03-27 10:36:44.812	2026-03-27 10:36:44.812
30	ОZON Воронеж	Транспортные услуги по маршруту г. Белгород - г. Воронеж (ОZON с. Александровка)	2026-03-18 13:09:52.276	2026-03-27 14:47:50.027
\.


--
-- Data for Name: cities_fbs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cities_fbs (id, short_name, full_name, created_at, updated_at) FROM stdin;
1	WB Курск FBS	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2026-03-15 17:37:45.824	2026-03-16 05:17:58.994
\.


--
-- Data for Name: client_service_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_service_prices (id, delivery_type_id, name, price, unit, comment, created_at, updated_at) FROM stdin;
1	2	Забор груза с адреса	1350	руб.	\N	2026-03-19 13:10:15.582	2026-03-19 13:10:15.582
3	1	Помощь на выгрузке	10	руб.	\N	2026-03-19 13:11:09.099	2026-03-19 13:11:17.183
4	2	Помощь на выгрузке	10	руб.	\N	2026-03-19 13:11:25.82	2026-03-19 13:11:25.82
2	1	Забор груза с адреса	500	руб.	\N	2026-03-19 13:10:28.444	2026-03-19 13:13:53.911
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, telegram_id, username, first_name, last_name, consent_given, consent_at, created_at, phone, email) FROM stdin;
845	1976364257	SolodKsu	Оксана		t	2026-04-06 07:09:51.286	2026-04-06 07:09:51.288	79040992526	Ksunya2008@list.ru
869	8221347360	\N	Татьяна	\N	t	2026-04-06 12:54:20.701	2026-04-06 12:54:20.703	79805253756	office31bel@yandex.ru
349	719302353	sergeevna_lug	Екатерина	Погорелая (Луговская)	t	2026-03-18 15:58:04.631	2026-03-18 15:58:04.634	79040888003	\N
484	1140369047	\N	Генрик Аванесян	\N	t	2026-03-24 16:03:37.169	2026-03-24 16:03:37.17	\N	\N
256	666221320	Ekaterina_Yakunova	КАТЕРИНА	\N	t	2026-03-16 09:36:44.319	2026-03-16 09:36:44.32	79803211839	\N
633	5616143395	\N	Психолог КПТ - Наталья	\N	t	2026-03-30 07:45:25.072	2026-03-30 07:45:25.073	79172402320	\N
695	1020218571	\N	Елена 🧐	К...	t	2026-03-31 08:02:45.156	2026-03-31 08:02:45.159	\N	\N
950	1794170663	Vladimir_Wo	Владимир		t	2026-04-08 14:01:55.091	2026-04-08 14:01:55.092	79805253489	w350031@gmail.com
342	215129102	Julia_LoveStore	Юлия		t	2026-03-18 12:20:55.679	2026-03-18 12:20:55.681	79155259737	\N
276	737391767	VitaliyDok86	Виталий	\N	t	2026-03-16 11:49:30.73	2026-03-16 11:49:30.731	\N	\N
397	1976384882	yuliya_chuprinaa	Менеджер Вайлдбериз / Инфографика WB/OZON		t	2026-03-20 12:47:40.485	2026-03-20 12:47:40.486	+79611778076	chuprina1405@yandex.ru
606	531216416	Nastasiya_P31	Анастасия		t	2026-03-29 14:53:43.435	2026-03-29 14:53:43.436	+79103650731	ponomarenko140694@yandex.ru
1013	1238209094	Krulikovsky	Komrade	Krulikovsky	t	2026-04-13 11:29:53.344	2026-04-13 11:29:53.347	79192242055	Komradekrumax@gmail.com
729	2052779410	Alexsandr_Bibikov	Александр	Бибиков	t	2026-04-01 09:31:48.413	2026-04-01 09:31:48.414	79155726457	Marketbav@yandex.ru
970	840266604	BlackJakovich	Лексей	Б	t	2026-04-09 11:51:43.713	2026-04-09 11:51:43.715	79300890727	Ceramicprobelgorod@mail.ru
237	238345352	lena_dolmel	Lena	Dolm	t	2026-03-15 21:50:38.427	2026-03-15 21:50:38.428	79087846852	\N
430	1028993017	Vegarus31	Вячеслав ("Вегарус")		t	2026-03-23 07:38:41.394	2026-03-23 07:38:41.397	+79511546601	bokerama@mail.ru
535	5392232342	nameNikolayM	николай		t	2026-03-27 07:44:06.628	2026-03-27 07:44:06.629	79606209411	Nik-Al-March@yandex.ru
418	web_79991214545	\N	\N	\N	t	2026-03-22 12:50:47.699	2026-03-22 12:50:47.7	79991214545	\N
376	5130918980	lazerwood31	Савочкин	Александр	t	2026-03-19 13:38:17.902	2026-03-19 13:38:17.903	79205629123	Aleksandr.sav.84@mail.ru
245	5291810847	Kardi_85	Юлия	Кардашова	t	2026-03-16 08:43:28.557	2026-03-16 08:43:28.558	79511497636	kualeksej@gmail.com
801	1534902869	Djvksnv	Кнрд	Кнрд	t	2026-04-03 09:21:57.795	2026-04-03 09:21:57.795	79507156221	dimagensh98@gmail.com
315	1756916967	varvara2830	Варвара	Савина	t	2026-03-17 17:49:31.517	2026-03-17 17:49:31.518	79805232002	\N
411	5142508014	\N	Ирина		t	2026-03-21 20:37:04.796	2026-03-21 20:37:04.797	79192209444	Irinabelgorod07@mail.ru
298	6411930323	Frugly123	Frugly		t	2026-03-17 08:02:55.874	2026-03-17 08:02:55.875	+79155636509	\N
291	979243680	svg2031	Сергей/SVG		t	2026-03-17 05:51:31.569	2026-03-17 05:51:31.571	79155614178	konti-bel@mail.ru
285	1807623412	ths_darksun	Таха		t	2026-03-16 13:43:48.355	2026-03-16 13:43:48.356	79058792805	\N
283	1471228829	polinnavi	Полина		t	2026-03-16 13:08:37.165	2026-03-16 13:08:37.166	79914052386	polinakibec10@gmail.com
460	1477768604	ViacheslavVetrenko	Вячеслав	Ветренко	t	2026-03-23 15:47:10.576	2026-03-23 15:47:10.577	+79066061155	shense.31@yandex.ru
434	783251127	tatestet	Татьяна	Криушина	t	2026-03-23 09:14:16.623	2026-03-23 09:14:16.626	79194371103	Tk0803@mail.ru
192	638740448	Artem_Solovyev	Артём	Соловьев	t	2026-03-12 14:24:40.352	2026-03-12 14:24:40.353	79611788862	pejon2323@mail.ru
723	934921285	v_stay_miiid	Мао		t	2026-04-01 09:11:43.11	2026-04-01 09:11:43.111	+79092068374	krotmol24@gmail.com
252	875084249	maxxerw	blessedness	\N	t	2026-03-16 09:15:43.138	2026-03-16 09:15:43.139	79290024469	imbot7@gmail.com
186	497135054	kriushin1	Павел		t	2026-03-12 10:46:09.755	2026-03-12 10:46:09.756	79102206684	2206684@bk.ru
257	348549987	Namelessq	Денис	Правдин	t	2026-03-16 09:37:06.7	2026-03-16 09:37:06.701	79066018113	sg1gznk@gmail.com
561	903096115	nadya_pashkina	Надя	\N	t	2026-03-28 08:05:32.478	2026-03-28 08:05:32.479	\N	\N
453	2115294698	matreshkamp31	Katerina	Matreshka 🤍	t	2026-03-23 13:45:08.347	2026-03-23 13:45:08.348	79202020054	katerina.s.31@mail.ru
615	985199932	Irinafedotovawb	Ирина	Федотова	t	2026-03-30 06:21:51.724	2026-03-30 06:21:51.725	+79524363683	belmed.irina@mai.ru
471	978898163	elenamil23	Елена		t	2026-03-24 06:54:55.693	2026-03-24 06:54:55.695	79103691897	doroninae2018@gmail.com
304	1433936502	alicekn	Алиса		t	2026-03-17 10:00:37.482	2026-03-17 10:00:37.483	79803925334	\N
716	503542959	ivan_yurchennko	Иван	Юрченко	t	2026-03-31 13:55:28.029	2026-03-31 13:55:28.03	79102221486	ivan.yu2020@mail.ru
269	1346071535	svetik_uspeh	Светлана		t	2026-03-16 10:46:57.501	2026-03-16 10:46:57.503	+79051737024	\N
663	954569889	territoriyaRu	Ру		t	2026-03-30 12:21:34.746	2026-03-30 12:21:34.747	79192824777	Krute-verte@yandex.ru
518	950878961	den_topseo	Denis		t	2026-03-26 07:23:50.214	2026-03-26 07:23:50.216	+79066006666	ip.astapov@gmail.com
493	548299782	nina_nina85	Nina	🌸	t	2026-03-25 09:59:33.269	2026-03-25 09:59:33.27	79107363637	Ninaavdeeva85@gmail.com
760	2119491333	Irisha_Skl	Iris		t	2026-04-02 08:28:19.277	2026-04-02 08:28:19.278	79045318163	irina-sklyarova@rambler.ru
265	5342933095	Oleg_Herald	Олег	Гончар	t	2026-03-16 09:51:59.164	2026-03-16 09:51:59.165	79606203709	Oleg_g.r@mail.ru
363	696621392	ka_miss	Аня		t	2026-03-19 09:39:25.681	2026-03-19 09:39:25.682	+79194373797	\N
751	1965149987	ViktoriaMaksimec	Виктория Максимец		t	2026-04-01 18:36:29.026	2026-04-01 18:36:29.027	79102221934	viktoria.maksimecz@mail.ru
258	5282205889	evgeniy78915003	Евгений		t	2026-03-16 09:37:26.46	2026-03-16 09:37:26.462	79956303005	tyr_bgd31@mail.ru
785	7438232178	\N	Алексей		t	2026-04-02 15:02:32.912	2026-04-02 15:02:32.913	79107374328	kapipast@list.ru
202	7125637394	\N	Дом	Ремонта	t	2026-03-13 14:04:25.465	2026-03-13 14:04:25.468	79192843003	\N
223	918858687	faded679	faded		t	2026-04-13 07:50:53.482	2026-03-15 11:55:04.007	+79155212770	kriushin04@gmail.com
670	5018988081	Evgeniy_Kunitsyn	Евгений	Куницын	t	2026-03-30 12:58:09.898	2026-03-30 12:58:09.899	+79205502220	Kunizin2009@yandex.ru
292	136548577	postapop	Alexander		t	2026-03-17 07:21:45.748	2026-03-17 07:21:45.749	79155664511	\N
254	523937271	lion13031987	Александр		t	2026-03-16 09:22:49.181	2026-03-16 09:22:49.181	79805228792	levshina03071989@mail.ru
613	1353235075	mari_gu31	Марина	Хорошилова	t	2026-03-30 05:12:51.097	2026-03-30 05:12:51.099	79040988008	Marjusik08@rambler.ru
384	497414475	RomanVladimirovich11	Роман		t	2026-03-20 07:50:50.758	2026-03-20 07:50:50.759	79202013192	Shatohin.roma@mail.ru
240	449540723	ivanek31	Иван	Подколодный	t	2026-03-16 08:11:31.176	2026-03-16 08:11:31.177	79103267515	\N
414	web_9155212770	\N	\N	\N	t	2026-03-22 09:36:11.247	2026-03-22 09:36:11.248	9155212770	\N
738	1847009451	Alexandra_2211t	Александра		t	2026-04-01 13:55:43.581	2026-04-01 13:55:43.582	79192204060	Nesmor@yandex.ru
209	1901073294	SolovyovEx	Менеджер Solo-GoMarket		t	2026-03-13 15:22:54.532	2026-03-13 15:22:54.533	79092048554	\N
368	1971137994	Natalkagavr	Наталья	\N	t	2026-03-19 10:14:51.594	2026-03-19 10:14:51.597	79611718191	agrovi-k@mali.ru
482	1298922359	kalashnikAlexs	Саша	Калашник	t	2026-03-24 15:12:44.843	2026-03-24 15:12:44.845	79155259660	ak-tender@lust.ru
306	5192162855	AlekseyOld	Алексей	\N	t	2026-03-17 11:07:37.78	2026-03-17 11:07:37.781	79155611244	Dag-31petkus@mail.ru
536	1916763326	primernyy	Sovest'		t	2026-03-27 07:47:54.503	2026-03-27 07:47:54.504	\N	\N
486	929412363	psy_lingva	Евгения	Бузина	t	2026-03-25 07:11:48.203	2026-03-25 07:11:48.205	79606221215	buzina@setka-garmoshka.ru
423	1394949575	GenaChib	Гена		t	2026-03-23 06:19:10.605	2026-03-23 06:19:10.606	79511373615	Chibisbelg@mail.ru
260	432896163	pavel_inoar	Павел		t	2026-03-16 09:43:26.568	2026-03-16 09:43:26.569	79092036600	Inoar31@mail.ru
402	999216882	Natalimorozka	Наталья		t	2026-03-20 16:26:50.995	2026-03-20 16:26:50.998	79103226735	morozko110969@mail.ru
755	1042655828	sergey_vl_shcherbakov	Сергей	Щербаков	t	2026-04-02 06:02:13.375	2026-04-02 06:02:13.377	79205554425	shcherbakov.s@gmail.com
435	1788460822	Akutafin	Кутафин А.		t	2026-03-23 09:22:29.039	2026-03-23 09:22:29.04	79517656643	Kualeksej@gmail.com
350	369690546	Anastasiya_18z	Анастасия		t	2026-03-18 16:36:16.353	2026-03-18 16:36:16.354	79040817657	\N
853	5296300954	\N	Наташа	Климанова	t	2026-04-06 08:07:26.587	2026-04-06 08:07:26.588	79103221132	klimanovanatalia@icloud.com
724	1272380429	Z96198	Коля Николай		t	2026-04-01 09:12:36.203	2026-04-01 09:12:36.204	79205743564	96198@mail.ru
346	844538975	KsuBelgorod	Ксюша		t	2026-03-18 15:00:44.617	2026-03-18 15:00:44.618	+79155635944	\N
188	6821628014	maximus_311	Максим		t	2026-03-12 12:13:58.73	2026-03-12 12:13:58.733	79934066684	kriushin04@gmail.com
436	902714245	ELENA_RU31	Elena		t	2026-03-23 09:23:51.248	2026-03-23 09:23:51.25	79611643525	cherkashina.kira@mail.ru
764	277739287	Lyubavagayd	💎Люба💎		t	2026-04-02 10:01:55.341	2026-04-02 10:01:55.342	79524212930	shulginalyuba@yandex.ru
266	383826621	dimvolobuev	Дмитрий		t	2026-03-16 10:10:54.144	2026-03-16 10:10:54.145	+79511489255	\N
463	1262804575	\N	Марина		t	2026-03-23 17:16:03.065	2026-03-23 17:16:03.067	79103650233	mara_bel13@mail.ru
454	2099027638	\N	Vikulya		t	2026-03-23 14:16:03.368	2026-03-23 14:16:03.37	79524320841	Nikasz@mail.ru
300	1074888055	Fanter3011	Fanter	.	t	2026-03-17 08:31:12.84	2026-03-17 08:31:12.841	79155298937	Fanat.warface.1@mail.ru
316	789624731	\N	Алексей		t	2026-03-17 18:04:11.119	2026-03-17 18:04:11.122	79087855973	mopedplus@mail.ru
718	720428758	vkkozlov	Vladimir	\N	t	2026-03-31 14:04:18.035	2026-03-31 14:04:18.036	79803740565	kozlov-vk@bk.ru
952	753783327	brexcel	Алексей	Головинов 💈	t	2026-04-08 17:49:24.063	2026-04-08 17:49:24.065	79202014657	pic_broker@mail.ru
807	1271848025	evgeniya_supernova	Евгения	Гузачева	t	2026-04-03 13:09:48.337	2026-04-03 11:55:37.573	79103261777	forever2575@mail.ru
270	833499679	ElenaKosla	Elena		t	2026-03-16 10:49:25.202	2026-03-16 10:49:25.203	79192860803	\N
648	1019476023	X_katyX	Екатерина		t	2026-03-30 08:40:49.046	2026-03-30 08:40:49.047	79517682055	e.hatsenovitch@yandex.ru
528	1344044568	Golubov6888	Александр	Продвижение на маркетплейсах	t	2026-03-26 13:18:25.075	2026-03-26 13:18:25.076	79517686888	Golubov-1985@mail.ru
198	998498	dwuw85	Alexey		t	2026-03-13 12:02:34.25	2026-03-13 12:02:34.252	79194336644	astrabel1@yabdex.ru
700	5728938714	Sasha_naygad	Александр		t	2026-03-31 09:02:01.249	2026-03-31 09:02:01.25	+79517619237	naygadd@gmail.com
503	250647559	ElenaEvtuschenko	Елена	Е.	t	2026-03-25 10:48:53.436	2026-03-25 10:48:53.437	79507131488	Evtuschenckolena@yandex.ru
886	875848600	AnyaBurak	Anna	Burak	t	2026-04-07 07:08:54.463	2026-04-07 07:08:54.466	375336087164	Anna.Burak16@yandex.ru
999	8717221941	sssrraahg	Re	\N	t	2026-04-11 10:15:36.186	2026-04-11 10:15:36.188	79332118959	Rashid.mg@bk.ru
793	5635476029	mmp_sofuto	Анастасия	Менеджер Маркетплейсов	t	2026-04-03 06:52:16.544	2026-04-03 06:52:16.546	+79606251778	torpova.av@yandex.ru
621	553976487	Yulik167	Yulia		t	2026-03-30 06:37:01.345	2026-03-30 06:37:01.348	79155746999	Yulik167@yandex.ru
781	5594241541	plusminus77777	Плюс минус	\N	t	2026-04-02 13:00:18.779	2026-04-02 13:00:18.78	\N	\N
199	998811756	radar000	Vladimir	Dolya	t	2026-03-13 13:26:27.624	2026-03-13 13:26:27.625	+79770672423	\N
347	988348078	WM_711	Олег		t	2026-03-18 15:13:44.949	2026-03-18 15:13:44.952	79087847784	\N
558	589654542	rrrybochka	Кристина	Каменева	t	2026-03-27 13:56:28.085	2026-03-27 13:56:28.087	79103227202	Galekristina@yandex.ru
389	846768892	LudmilaRR	Людмила | Менеджер маркетплейсов		t	2026-03-20 08:38:11.609	2026-03-20 08:38:11.61	79155616564	alissirossi31@yandex.ru
614	1859924240	annchueva	Анна	Чуева	t	2026-03-30 06:04:07.998	2026-03-30 06:04:07.999	79805229129	Anna.vetrovskaya@mail.ru
268	173037638	seobel	Dmitry	\N	t	2026-03-16 10:43:02.134	2026-03-16 10:43:02.136	79103201834	\N
297	210006160	Ievel_25	Сергей		t	2026-03-17 07:39:56.009	2026-03-17 07:39:56.01	79102289713	\N
241	673571961	Olly_94	Ольга		t	2026-03-16 08:14:38.207	2026-03-16 08:14:38.208	79205727318	Logvinovaolga941@gmail.com
312	7592906958	L_AndreyW	༺ Andrey ༻	\N	t	2026-03-17 15:34:28.518	2026-03-17 15:34:28.519	+79290022270	\N
855	1083983807	klimashkina	Klimashkina		t	2026-04-06 08:35:45.76	2026-04-06 08:35:45.763	79032131307	annak13072002@icloud.com
757	5102350599	\N	Евгений	Скрадин	t	2026-04-02 06:47:33.705	2026-04-02 06:47:33.706	79103603233	skradin@mail.ru
408	8299275130	smayliksa	Елена	\N	t	2026-03-21 11:59:24.472	2026-03-21 11:59:24.473	\N	\N
483	1007972183	varyag_80kg	Рафаэль	\N	t	2026-03-24 15:48:02.687	2026-03-24 15:48:02.689	79092038399	rafael.pro.6@mail.ru
674	8758930212	\N	N	Z	t	2026-03-30 13:13:51.309	2026-03-30 13:13:51.31	+79696301004	yu.viso4enko@yandex.ru
797	982662919	\N	Marina	Petrova	t	2026-04-03 08:28:09.013	2026-04-03 08:28:09.014	79192872669	marina_tugols@mail.ru
814	519276511	YanaFoteeva	Яна	Фотеева	t	2026-04-03 13:14:27.791	2026-04-03 13:14:27.792	79163316644	foteeva.yanochka@yandex.ru
303	1169829956	\N	Елена		t	2026-03-17 09:17:18.195	2026-03-17 09:17:18.198	79087813240	\N
375	452715082	iolshevski	Игорь	Ольшевский	t	2026-03-19 13:16:36.502	2026-03-19 13:16:36.504	79103666662	Igorytina@mail.ru
492	1822909132	AndreVink	Andrey	V	t	2026-03-25 09:55:31.63	2026-03-25 09:55:31.631	79066030867	Нету@mail.ru
749	719281283	MariTreexi	Мария	Слепкина	t	2026-04-01 17:52:57.505	2026-04-01 17:52:57.507	79517692444	mmari_92@mail.ru
512	579203572	\N	Лёха		t	2026-03-25 14:08:56.652	2026-03-25 14:08:56.654	79511466409	rtexs@yandex.ru
362	942167479	makcuk771	Максим		t	2026-03-19 09:36:06.418	2026-03-19 09:36:06.421	79623062005	\N
263	592693929	Natalohkaskakalohka	Натали		t	2026-03-16 09:46:48.417	2026-03-16 09:46:48.418	79056758813	znatali_14@mail.ru
255	1853070129	VeronikaD31	Veronika		t	2026-03-16 09:35:37.915	2026-03-16 09:35:37.916	79524259955	\N
890	970255871	Derbina_anastasiya	Анастасия	Дербина	t	2026-04-07 07:54:12.34	2026-04-07 07:54:12.341	+79611649451	derbina_1985@mail.ru
273	816909271	YuliaBa11	Юлия		t	2026-03-16 11:34:36.497	2026-03-16 11:34:36.498	79511591908	\N
281	6938216826	\N	Sumkikozha		t	2026-03-18 07:22:58.549	2026-03-16 12:41:28.349	79192211576	elvisbel@yandex.ru
655	1469289882	Maxprod31	Максим		t	2026-03-30 11:26:54.974	2026-03-30 11:26:54.975	\N	Maxprod31@mail.ru
214	434140653	shem23	Shem		t	2026-03-13 18:27:27.089	2026-03-13 18:27:27.092	79155603498	\N
427	1247307542	ulia_1979	Юлия	Юлия	t	2026-03-23 07:31:43.455	2026-03-23 07:31:43.456	79103603237	uliacausova108@gmail.com
459	6530731325	\N	Д		t	2026-03-23 14:40:51.973	2026-03-23 14:40:51.974	79290019199	danjiel1@bk.ru
709	1303382635	Hello_manicure	Lusia M		t	2026-03-31 11:40:59.605	2026-03-31 11:40:59.606	79202000003	Klenina.mila@mail.ru
966	731681104	Nataliya2204	Наталья	\N	t	2026-04-09 11:05:19.869	2026-04-09 11:05:19.871	79615179733	yakimova_natalya@list.ru
721	622813098	RomanDostoevsky	Роман	\N	t	2026-04-01 07:24:37.238	2026-04-01 07:24:37.239	\N	\N
631	181875861	LeoB65	🐾		t	2026-03-30 07:34:37.698	2026-03-30 07:34:37.699	79192273733	officebezrukov@yandex.ru
250	581145892	OllyVel	Ольга		t	2026-03-16 09:07:46.297	2026-03-16 09:07:46.298	79102252860	\N
725	7995651092	\N	Юля	Коровайцева	t	2026-04-01 09:15:04.9	2026-04-01 09:15:04.902	79038846441	ykorovajceva@mail.ru
439	430722020	ne_alexey_12	Alexey		t	2026-03-23 11:00:09.092	2026-03-23 11:00:09.093	79300876520	kl3pspider@yandex.ru
262	598947746	\N	E.	S.	t	2026-03-16 09:46:03.753	2026-03-16 09:46:03.754	+79103604658	johny.2010@mail.ru
426	438197293	den_kuh	Denis	Kukharev	t	2026-03-23 07:31:30.016	2026-03-23 07:31:30.018	79155753506	den-kukh7@yandex.ru
\.


--
-- Data for Name: counterparties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counterparties (id, name, inn, kpp, ogrn, address, account, bik, correspondent_account, bank, director, contract, created_at, updated_at, director_post, org_status, org_type, short_name) FROM stdin;
39	Индивидуальный предприниматель Зайцева Наталья Александровна	310209286941	\N	325310000057250	Белгородская обл, Белгородский р-н, пгт Северный	\N	\N	\N	\N	\N	\N	2026-03-16 12:47:25.49	2026-03-17 09:45:25.035	\N	Действующая	Индивидуальный предприниматель	ИП Зайцева Наталья Александровна
29	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЕВРО СПРЕЙ"	3123460003	312301001	1193123022828	г Белгород, ул Корочанская, д 132А, офис 8	\N	\N	\N	\N	Лычева Юлия Владимировна	\N	2026-03-16 09:36:00.297	2026-03-16 09:55:40.655	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "ЕВРО СПРЕЙ"
33	Индивидуальный предприниматель Волобуев Дмитрий Сергеевич	461400229170	\N	322310000043040	Белгородская обл, Белгородский р-н, поселок Майский, Майский пер	\N	\N	\N	\N	\N	\N	2026-03-16 10:11:56.507	2026-03-16 10:16:26.452	\N	Действующая	Индивидуальный предприниматель	ИП Волобуев Дмитрий Сергеевич
23	Индивидуальный предприниматель Шемякин Константин Владимирович	312340916783	\N	322310000033160	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-13 18:27:44.871	2026-03-15 09:39:55.282	\N	Действующая	Индивидуальный предприниматель	ИП Шемякин Константин Владимирович
36	Индивидуальный предприниматель Бабинова Юлия Николаевна	312334464306	\N	321312300070962	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-16 11:39:10.54	2026-04-03 08:36:22.241	\N	Действующая	Индивидуальный предприниматель	ИП Бабинова Юлия Николаевна
31	ИП Анисимов Павел Владимирович	700704621620	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 09:44:22.603	2026-03-16 09:44:22.603	\N	\N	\N	\N
38	ИП Гончар Олег Сергеевич	310263763374	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 12:36:50.42	2026-03-16 12:36:50.42	\N	\N	\N	\N
25	Индивидуальный предприниматель Долматова Елена Юрьевна	311603453896	\N	317312300029641	Белгородская область, Борисовский район, Белянский, с Беленькое	\N	\N	\N	\N	\N	\N	2026-03-15 21:50:58.66	2026-03-17 09:45:41.37	\N	Действующая	Индивидуальный предприниматель	ИП Долматова Елена Юрьевна
26	Индивидуальный предприниматель Подколодный Иван Романович	311004958305	\N	323310000054644	Белгородская область, Корочанский район, Ломовский, с Гремячье	\N	\N	\N	\N	\N	\N	2026-03-16 08:12:35.243	2026-03-17 09:45:49.779	\N	Действующая	Индивидуальный предприниматель	ИП Подколодный Иван Романович
45	Индивидуальный предприниматель Аулова Елена Николаевна	312318008708	\N	324310000000784	Белгородская область, Белгородский район, Новосадовский, п Новосадовый	\N	\N	\N	\N	\N	\N	2026-03-17 09:19:08.683	2026-03-17 09:44:53.436	\N	Действующая	Индивидуальный предприниматель	ИП Аулова Елена Николаевна
44	Индивидуальный предприниматель Гришковей Григорий Александрович	312331778375	\N	319312300057488	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-17 08:03:51.682	2026-03-17 09:44:58.896	\N	Действующая	Индивидуальный предприниматель	ИП Гришковей Григорий Александрович
43	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ВРЕКЛАМЕ"	3123449930	312301001	1193123004931	г Белгород, ул Магистральная, д 2А, офис 2	\N	\N	\N	\N	Шутенко Наталья Николаевна	\N	2026-03-17 07:23:43.855	2026-03-17 09:45:05.436	ГЕНЕРАЛЬНЫЙ ДИРЕКТОР	Действующая	Юридическое лицо	ООО "ВРЕКЛАМЕ"
42	Индивидуальный предприниматель Катилоглы Наталья Владимировна	621403086153	\N	324620000040321	Республика Мордовия, Старошайговский район, Старотеризморгский, с Старая Теризморга	\N	\N	\N	\N	\N	\N	2026-03-16 14:10:55.259	2026-03-17 09:45:12.294	\N	Действующая	Индивидуальный предприниматель	ИП Катилоглы Наталья Владимировна
40	Индивидуальный предприниматель Гончаренко Вадим Павлович	312301259291	\N	304312335900994	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-16 13:10:50.087	2026-03-17 09:45:19.906	\N	Действующая	Индивидуальный предприниматель	ИП Гончаренко Вадим Павлович
27	Индивидуальный предприниматель Лепилина Ольга Владимировна	352517643523	\N	318312300026176	Белгородская обл, Белгородский р-н, пгт Разумное	\N	\N	\N	\N	\N	\N	2026-03-16 09:08:31.398	2026-03-17 09:45:57.25	\N	Действующая	Индивидуальный предприниматель	ИП Лепилина Ольга Владимировна
35	Индивидуальный предприниматель Тетюхин Олег Юрьевич	312302984310	\N	317312300039001	Белгородская обл, Белгородский р-н, поселок Майский, Майский пер	\N	\N	\N	\N	\N	\N	2026-03-16 11:10:40.404	2026-03-17 09:46:03.195	\N	Действующая	Индивидуальный предприниматель	ИП Тетюхин Олег Юрьевич
34	Индивидуальный предприниматель Досманова Светлана Николаевна	310802350773	\N	304310312900092	Белгородская область, Грайворонский район, Головчинский, с Головчино	\N	\N	\N	\N	\N	\N	2026-03-16 10:47:29.519	2026-03-17 09:46:08.655	\N	Действующая	Индивидуальный предприниматель	ИП Досманова Светлана Николаевна
32	Индивидуальный предприниматель Скворцов Евгений Валерьевич	312772503303	\N	323310000033194	Белгородская обл, Губкинский р-н, село Шорстово	\N	\N	\N	\N	\N	\N	2026-03-16 09:46:35.308	2026-03-17 09:46:20.525	\N	Действующая	Индивидуальный предприниматель	ИП Скворцов Евгений Валерьевич
30	Индивидуальный предприниматель Якунова Екатерина Александровна	312323836506	\N	321312300060343	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-16 09:37:25.462	2026-03-17 09:46:26.125	\N	Действующая	Индивидуальный предприниматель	ИП Якунова Екатерина Александровна
41	Индивидуальный предприниматель Соловьев Артём Александрович	302201915296	\N	321312300054537	Прохоровский район Белгородская область, с. Лучки, ул. Власова 66	\N	\N	\N	\N	\N	\N	2026-03-16 13:17:11.243	2026-03-17 10:47:58.877	\N	Действующая	Индивидуальный предприниматель	ИП Соловьев Артём Александрович
46	Индивидуальный предприниматель Широкая Алиса Алексеевна	637592639150	\N	321312300064406	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-17 10:07:10.929	2026-03-17 11:12:45.415	\N	Действующая	Индивидуальный предприниматель	ИП Широкая Алиса Алексеевна
47	ООО "РИНГ АБРАЗИВ РУС"	3123370303	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 15:35:25.007	2026-03-17 15:35:25.007	\N	\N	\N	\N
48	ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО "РОССИЙСКИЕ ЖЕЛЕЗНЫЕ ДОРОГИ"	7708503727	770801001	1037739877295	г Москва, ул Новая Басманная, д 2/1 стр 1	\N	\N	\N	\N	Белозёров Олег Валентинович	\N	2026-03-18 10:18:00.841	2026-04-12 15:37:13.062	ГЕНЕРАЛЬНЫЙ ДИРЕКТОР-ПРЕДСЕДАТЕЛЬ ПРАВЛЕНИЯ	Действующая	Юридическое лицо	ОАО "РЖД"
50	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "КОТОФИЛ"	2540278854	310001001	1232500020983	г Белгород, ул Шаландина, д 10, помещ 1	\N	\N	\N	\N	Родин Игорь Юрьевич	\N	2026-03-18 12:57:16.592	2026-03-18 13:18:44.734	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "КОТОФИЛ"
62	Индивидуальный предприниматель Воронин Алексей Георгиевич	312302111026	\N	321312300001141	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-20 08:41:05.605	2026-03-20 09:21:51.659	\N	Действующая	Индивидуальный предприниматель	ИП Воронин Алексей Георгиевич
52	ИП Калачев Дмитрий Сергеевич	781430735672	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 15:01:42.708	2026-03-18 15:01:42.708	\N	\N	\N	\N
54	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АГРОВИ"	3123305784	312701001	1123123014244	Белгородская обл, Губкинский р-н, село Скородное, ул 1 Мая, д 4, офис 11	\N	\N	\N	\N	Лавров Сергей Иванович	\N	2026-03-18 15:59:12.651	2026-03-19 05:59:56.828	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "АГРОВИ"
55	Индивидуальный предприниматель Телешенко Анастасия Геннадьевна	311301471962	\N	321312300031148	Белгородская область, Белгородский район, Пушкарский, с Пушкарное	\N	\N	\N	\N	\N	\N	2026-03-18 16:36:55.647	2026-03-19 06:00:01.469	\N	Действующая	Индивидуальный предприниматель	ИП Телешенко Анастасия Геннадьевна
53	Индивидуальный предприниматель Максимчук Олег Викторович	312605708076	\N	319312300082177	Белгородская обл, г Валуйки	\N	\N	\N	\N	\N	\N	2026-03-18 15:15:23.545	2026-03-19 06:00:06.857	\N	Действующая	Индивидуальный предприниматель	ИП Максимчук Олег Викторович
51	Индивидуальный предприниматель Гузенко Сергей Андреевич	312006684524	\N	323310000068554	Белгородская обл, г Шебекино	\N	\N	\N	\N	\N	\N	2026-03-18 13:50:44.425	2026-03-19 06:00:13.691	\N	Действующая	Индивидуальный предприниматель	ИП Гузенко Сергей Андреевич
49	Индивидуальный предприниматель Лагутина Елена Николаевна	312330492180	\N	319312300074170	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-18 10:59:53.873	2026-03-19 06:00:21.318	\N	Действующая	Индивидуальный предприниматель	ИП Лагутина Елена Николаевна
57	Индивидуальный предприниматель Кухарева Кристина Игоревна	312336675817	\N	314312307000056	г Элиста	\N	\N	\N	\N	\N	\N	2026-03-19 09:43:54.307	2026-03-19 14:29:05.043	\N	Действующая	Индивидуальный предприниматель	ИП Кухарева Кристина Игоревна
56	Индивидуальный предприниматель Минакова Марина Викторовна	312303413735	\N	311312332700147	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-19 09:39:46.414	2026-03-19 14:29:09.712	\N	Действующая	Индивидуальный предприниматель	ИП Минакова Марина Викторовна
59	Индивидуальный предприниматель Савочкин Александр Анатольевич	310611330487	\N	324310000078082	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-19 14:03:32.929	2026-03-19 16:57:06.502	\N	Действующая	Индивидуальный предприниматель	ИП Савочкин Александр Анатольевич
61	Индивидуальный предприниматель Евдокимов Андрей Владимирович	310205287912	\N	317312300079981	Белгородская область, Белгородский район, Стрелецкий, с Стрелецкое	\N	\N	\N	\N	\N	\N	2026-03-20 06:54:28.038	2026-03-20 09:21:54.381	\N	Действующая	Индивидуальный предприниматель	ИП Евдокимов Андрей Владимирович
60	Индивидуальный предприниматель Стариков Алексей Николаевич	310206203880	\N	325310000090964	Белгородская обл, Белгородский р-н, поселок Майский, Майский пер	\N	\N	\N	\N	\N	\N	2026-03-19 19:00:50.266	2026-03-20 09:22:01.779	\N	Действующая	Индивидуальный предприниматель	ИП Стариков Алексей Николаевич
18	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СВАРОГ"	3123219944	312301001	1103123012410	г Белгород, ул Михайловское шоссе, д 33А	\N	\N	\N	\N	Криушин Павел Владимирович	\N	2026-03-12 10:49:09.881	2026-04-10 16:55:29.46	ДИРЕКТОР	\N	Юридическое лицо	ООО "СВАРОГ"
63	ИП Бондаренко Ирина Владимировна	312232338285	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-21 20:37:56.952	2026-03-21 20:37:56.952	\N	\N	\N	\N
66	ИП Кутафин Алексей Михайлович	312326784920	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 18:24:48.82	2026-03-22 18:24:48.82	\N	\N	\N	\N
67	ИП Шатохин Роман Владимирович	310902795889	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 19:06:42.312	2026-03-22 19:06:42.312	\N	\N	\N	\N
78	Индивидуальный предприниматель Проданец Марина Алексеевна	312118658226	\N	325310000017168	Белгородская обл, г Строитель	\N	\N	\N	\N	\N	\N	2026-03-23 17:17:25.121	2026-03-24 03:43:39.423	\N	Действующая	Индивидуальный предприниматель	ИП Проданец Марина Алексеевна
77	Индивидуальный предприниматель Ветренко Вячеслав Вячеславович	312324160002	\N	317312300033604	Республика Калмыкия, Октябрьский район, Иджилская, п Иджил	\N	\N	\N	\N	\N	\N	2026-03-23 15:50:12.827	2026-03-24 03:43:43.351	\N	Действующая	Индивидуальный предприниматель	ИП Ветренко Вячеслав Вячеславович
76	Индивидуальный предприниматель Ковалева Виктория Алексеевна	890512179938	\N	323310000022545	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 14:21:56.611	2026-03-24 03:43:47.437	\N	Действующая	Индивидуальный предприниматель	ИП Ковалева Виктория Алексеевна
75	Индивидуальный предприниматель Рыжкова Елена Алексеевна	312328759598	\N	323310000059628	Республика Калмыкия, Октябрьский район, Иджилская, п Иджил	\N	\N	\N	\N	\N	\N	2026-03-23 13:18:16.807	2026-03-24 03:43:52.137	\N	Действующая	Индивидуальный предприниматель	ИП Рыжкова Елена Алексеевна
74	Индивидуальный предприниматель Мелехов Дмитрий Александрович	312329022253	\N	324310000042570	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 12:46:22.745	2026-03-24 03:43:58.285	\N	Действующая	Индивидуальный предприниматель	ИП Мелехов Дмитрий Александрович
73	Индивидуальный предприниматель Закусило Александра Сергеевна	312333020202	\N	324310000048962	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 11:02:03.097	2026-03-24 03:44:03.455	\N	Действующая	Индивидуальный предприниматель	ИП Закусило Александра Сергеевна
72	Индивидуальный предприниматель Чаусова Юлия Геннадьевна	312323052364	\N	323310000007952	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 07:44:03.649	2026-03-24 03:44:07.89	\N	Действующая	Индивидуальный предприниматель	ИП Чаусова Юлия Геннадьевна
71	Индивидуальный предприниматель Гаврилов Роман Вячеславович	312332151900	\N	324310000029536	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 07:39:54.818	2026-03-24 03:44:13.274	\N	Действующая	Индивидуальный предприниматель	ИП Гаврилов Роман Вячеславович
70	Индивидуальный предприниматель Кухарев Денис Игоревич	312334828627	\N	323310000027518	Белгородская область, Корочанский район, Мелиховский, с Дальняя Игуменка	\N	\N	\N	\N	\N	\N	2026-03-23 07:32:39.182	2026-03-24 03:44:18.707	\N	Действующая	Индивидуальный предприниматель	ИП Кухарев Денис Игоревич
69	Индивидуальный предприниматель Чеботенко Евгения Александровна	312730946335	\N	323310000042621	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 06:21:36.349	2026-03-24 03:44:24.923	\N	Действующая	Индивидуальный предприниматель	ИП Чеботенко Евгения Александровна
68	Индивидуальный предприниматель Жукова Ольга Сергеевна	312337060301	\N	323310000042955	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-23 05:00:19.017	2026-03-24 03:44:30.641	\N	Действующая	Индивидуальный предприниматель	ИП Жукова Ольга Сергеевна
65	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПРОМОП"	3123208910	312301001	1103123001387	г Белгород, 5-й Заводской пер, зд 11В	\N	\N	\N	\N	Кибец Андрей Витальевич	\N	2026-03-22 12:10:17.235	2026-03-24 03:44:40.529	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "ПРОМОП"
64	Индивидуальный предприниматель Германова Алла Юрьевна	312323654753	\N	321312300031798	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-22 06:38:45.259	2026-03-24 03:44:46.059	\N	Действующая	Индивидуальный предприниматель	ИП Германова Алла Юрьевна
79	Индивидуальный предприниматель Галкин Александр Сергеевич	263210336824	\N	325310000028750	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-24 09:11:56.785	2026-03-24 09:12:43.151	\N	Действующая	Индивидуальный предприниматель	ИП Галкин Александр Сергеевич
58	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "БАРНЕТТ"	3100039600	310001001	1243100012055	308516, БЕЛГОРОДСКАЯ ОБЛАСТЬ, М.О. БЕЛГОРОДСКИЙ, С. СЕВРЮКОВО, УЛ. СПОРТИВНАЯ, Д. 33	\N	\N	\N	\N	Ольшевский Игорь Геннадьевич	\N	2026-03-19 13:18:26.267	2026-03-24 14:02:50.75	ГЕНЕРАЛЬНЫЙ ДИРЕКТОР	Действующая	Юридическое лицо	ООО "БАРНЕТТ"
80	Индивидуальный предприниматель Калашник Александр Дмитриевич	311403828192	\N	324310000025280	Белгородская область, Новооскольский район, Богородский, с Богородское	\N	\N	\N	\N	\N	\N	2026-03-24 15:17:45.023	2026-03-24 17:02:28.081	\N	Действующая	Индивидуальный предприниматель	ИП Калашник Александр Дмитриевич
81	Индивидуальный предприниматель Лотков Денис Анатольевич	312325602905	\N	324310000010631	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-25 07:17:38.12	2026-03-25 08:38:19.576	\N	Действующая	Индивидуальный предприниматель	ИП Лотков Денис Анатольевич
84	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "БЕЛПАЛЛЕТ"	3123434691	312301001	1183123010289	г Белгород, ул Узенькая, д 3	\N	\N	\N	\N	Ткаченко Станислав Романович	\N	2026-03-25 10:50:41.983	2026-03-25 13:00:25.082	ГЕНЕРАЛЬНЫЙ ДИРЕКТОР	Действующая	Юридическое лицо	ООО "БЕЛПАЛЛЕТ"
83	Индивидуальный предприниматель Авдеева Нина Владимировна	312323361394	\N	322310000012360	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-25 10:00:15.117	2026-03-25 13:00:28.456	\N	Действующая	Индивидуальный предприниматель	ИП Авдеева Нина Владимировна
82	Индивидуальный предприниматель Винюков Андрей Николаевич	312829572907	\N	322310000012207	Белгородская обл, г Старый Оскол	\N	\N	\N	\N	\N	\N	2026-03-25 09:59:04.375	2026-03-25 13:00:32.335	\N	Действующая	Индивидуальный предприниматель	ИП Винюков Андрей Николаевич
85	Индивидуальный предприниматель Ющенко Даниил Александрович	312344117767	\N	322310000043731	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-25 13:02:38.473	2026-03-25 13:04:20.369	\N	Действующая	Индивидуальный предприниматель	ИП Ющенко Даниил Александрович
86	Индивидуальный предприниматель Геращенко Алексей Андреевич	860900348538	\N	323310000085769	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-25 14:10:06.256	2026-03-25 14:53:39.72	\N	Действующая	Индивидуальный предприниматель	ИП Геращенко Алексей Андреевич
87	Индивидуальный предприниматель Астапов Денис Владимирович	312320726304	\N	305312321500041	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-26 07:24:17.796	2026-03-26 14:57:52.063	\N	Действующая	Индивидуальный предприниматель	ИП Астапов Денис Владимирович
88	ИП Голубов Александр Николаевич	312328906299	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-26 15:37:53.8	2026-03-26 15:37:53.8	\N	\N	\N	\N
89	Индивидуальный предприниматель Мороз Наталья Евгеньевна	310206531049	\N	322310000051705	Белгородская область, Белгородский район, Тавровский, с Таврово	\N	\N	\N	\N	\N	\N	2026-03-26 17:57:39.996	2026-03-26 18:00:57.421	\N	Действующая	Индивидуальный предприниматель	ИП Мороз Наталья Евгеньевна
91	Индивидуальный предприниматель Марченко Николай Алексеевич	310204058490	\N	323310000010704	Белгородская область, Белгородский район, Веселолопанский, с Веселая Лопань	\N	\N	\N	\N	\N	\N	2026-03-27 08:20:32.868	2026-03-27 13:37:10.005	\N	Действующая	Индивидуальный предприниматель	ИП Марченко Николай Алексеевич
90	Индивидуальный предприниматель Агеев Максим Юрьевич	312334077064	\N	325310000005372	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-27 07:39:36.531	2026-03-27 13:37:13.596	\N	Действующая	Индивидуальный предприниматель	ИП Агеев Максим Юрьевич
92	ИП Каменева Кристина Владимировна	312334408301	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-27 13:58:03.665	2026-03-27 13:58:03.665	\N	\N	\N	\N
96	Индивидуальный предприниматель Хорошилов Евгений Николаевич	361913135302	\N	319366800040168	Воронежская область, Острогожский район, Терновский, с Терновое	\N	\N	\N	\N	\N	\N	2026-03-30 06:26:26.472	2026-03-30 09:49:50.291	\N	Действующая	Индивидуальный предприниматель	ИП Хорошилов Евгений Николаевич
93	Индивидуальный предприниматель Пономаренко Анастасия Александровна	312824702670	\N	323310000082973	Белгородская область, Белгородский район, Тавровский, с Таврово	\N	\N	\N	\N	\N	\N	2026-03-29 14:54:36.696	2026-03-29 17:06:28.097	\N	Действующая	Индивидуальный предприниматель	ИП Пономаренко Анастасия Александровна
94	ИП Чуева Анна Андреевна	312823368711	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 06:05:00.612	2026-03-30 06:05:00.612	\N	\N	\N	\N
95	ИП Котова Полина Петровна	312322937100	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 06:23:24.238	2026-03-30 06:23:24.238	\N	\N	\N	\N
101	Индивидуальный предприниматель Хаценович Екатерина Ивановна	312011446130	\N	324310000084938	Белгородская обл, г Шебекино	\N	\N	\N	\N	\N	\N	2026-03-30 08:41:56.522	2026-03-30 09:49:26.71	\N	Действующая	Индивидуальный предприниматель	ИП Хаценович Екатерина Ивановна
100	Индивидуальный предприниматель Доронина Елена Дмитриевна	312303525206	\N	323310000075021	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-30 07:54:37.924	2026-03-30 09:49:34.553	\N	Действующая	Индивидуальный предприниматель	ИП Доронина Елена Дмитриевна
99	Индивидуальный предприниматель Безруков Леонид Николаевич	312332995929	\N	320312300012502	г Ижевск	\N	\N	\N	\N	\N	\N	2026-03-30 07:35:27.534	2026-03-30 09:49:39.084	\N	Действующая	Индивидуальный предприниматель	ИП Безруков Леонид Николаевич
98	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СТИЛБУРГ"	3123477247	312301001	1213100001729	г Белгород, ул Сумская, д 8, офис 212	\N	\N	\N	\N	Гончаров Виктор Александрович	\N	2026-03-30 06:41:12.117	2026-03-30 09:49:42.498	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "СТИЛБУРГ"
97	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АСТРА"	3123449761	312301001	1193123004579	г Белгород, ул Чапаева, д 1А, офис 6	\N	\N	\N	\N	Дымов Алексей Владимирович	\N	2026-03-30 06:40:47.554	2026-03-30 09:49:46.42	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "АСТРА"
104	ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЗЕЛЕНЫЙ МИР"	3123218073	310201001	1103123010605	Белгородская обл, Белгородский р-н, пгт Северный, ул Березовая, зд 1/21	\N	\N	\N	\N	Цыркунова Мария Александровна	\N	2026-03-30 13:16:16.601	2026-03-30 17:30:47.671	ДИРЕКТОР	Действующая	Юридическое лицо	ООО "ЗЕЛЕНЫЙ МИР"
103	Индивидуальный предприниматель Куницын Евгений Юрьевич	312118182378	\N	322310000010766	Белгородская область, Яковлевский район, Бутовский, с Бутово	\N	\N	\N	\N	\N	\N	2026-03-30 12:59:00.153	2026-03-30 17:30:54.948	\N	Действующая	Индивидуальный предприниматель	ИП Куницын Евгений Юрьевич
102	Индивидуальный предприниматель Мордвичев Руслан Вячеславович	312309199929	\N	321312300057029	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-30 12:22:52.357	2026-03-30 17:31:01.953	\N	Действующая	Индивидуальный предприниматель	ИП Мордвичев Руслан Вячеславович
105	Индивидуальный предприниматель Иньяков Максим Андреевич	311702951839	\N	321312300075564	Удмуртская Республика, Дебесский район, Уйвайский, д Марково	\N	\N	\N	\N	\N	\N	2026-03-31 07:25:19.267	2026-03-31 07:26:43.448	\N	Действующая	Индивидуальный предприниматель	ИП Иньяков Максим Андреевич
106	ИП Неминущий Александр Владимирович	310261068777	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 09:03:54.195	2026-03-31 09:03:54.195	\N	\N	\N	\N
107	Индивидуальный предприниматель Ермихина Людмила Ивановна	312327119299	\N	325310000032204	г Белгород	\N	\N	\N	\N	\N	\N	2026-03-31 11:49:17.537	2026-03-31 12:30:31.212	\N	Действующая	Индивидуальный предприниматель	ИП Ермихина Людмила Ивановна
108	ИП Юрченко Иван Романович	312182006806	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 13:56:14.889	2026-03-31 13:56:14.889	\N	\N	\N	\N
109	ИП Дубинкина Гульнар Шамильевна	312326865745	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 09:13:14.53	2026-04-01 09:13:14.53	\N	\N	\N	\N
110	ИП Бондаренко Николай Николаевич	890304144540	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 09:20:44.249	2026-04-01 09:20:44.249	\N	\N	\N	\N
111	ИП Бибикова Дарина Александровна	312732403870	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 09:35:14.838	2026-04-01 09:35:14.838	\N	\N	\N	\N
112	ИП Гетманцева Нина Сергеевна	312313448504	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 13:57:01.352	2026-04-01 13:57:01.352	\N	\N	\N	\N
113	ИП Маслова Мария Сергеевна	312338385013	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 17:53:34.883	2026-04-01 17:53:34.883	\N	\N	\N	\N
114	ИП Максимец Виктория Евгеньевна	312329043285	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 18:38:55.996	2026-04-01 18:38:55.996	\N	\N	\N	\N
116	ИП Склярова Ирина Александровна	461900980441	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 08:31:23.542	2026-04-02 08:31:23.542	\N	\N	\N	\N
115	Индивидуальный предприниматель Скрадина Любовь Олеговна	312103091311	\N	322312300014153	Белгородская область, Белгородский район, Тавровский, с Таврово	\N	\N	\N	\N	\N	\N	2026-04-02 07:14:30.975	2026-04-02 10:02:16.751	\N	Действующая	Индивидуальный предприниматель	ИП Скрадина Любовь Олеговна
117	Индивидуальный предприниматель Авилова Юлия Сергеевна	312345436131	\N	324310000023697	Белгородская обл, Белгородский р-н, мкр Ново-дубовской (п Дубовое)	\N	\N	\N	\N	\N	\N	2026-04-02 10:10:42.968	2026-04-02 10:13:17.576	\N	Действующая	Индивидуальный предприниматель	ИП Авилова Юлия Сергеевна
118	ИП Кушнарёв Александр Александрович	310509092337	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 15:03:36.131	2026-04-02 15:03:36.131	\N	\N	\N	\N
119	ИП Гузачева Евгения Андреевна	380415210205	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 11:57:02.22	2026-04-03 11:57:02.22	\N	\N	\N	\N
120	ИП Коровайцев Сергей Вячеславович	312332240903	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 06:08:38.828	2026-04-06 06:08:38.828	\N	\N	\N	\N
121	ИП Солодовникова Оксана Николаевна	312310325222	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 07:12:37.007	2026-04-06 07:12:37.007	\N	\N	\N	\N
122	ИП Климанова Наталья Сергеевна	312009355630	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 08:10:40.653	2026-04-06 08:10:40.653	\N	\N	\N	\N
124	ИП Бондаренко Татьяна Алексеевна	312012270271	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 14:47:53.224	2026-04-06 14:47:53.224	\N	\N	\N	\N
125	ИП Дербина Анастасия Валерьевна	312328041479	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 07:55:02.962	2026-04-07 07:55:02.962	\N	\N	\N	\N
132	ИП Левшина Анастасия Геннадиевна	312335137904	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 14:13:01.616	2026-04-07 14:13:01.616	\N	\N	\N	\N
135	ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО "ГАЗПРОМ"	7736050003	781401001	1027700070518	г Санкт-Петербург, Лахтинский пр-кт, д 2 к 3 стр 1	\N	\N	\N	\N	Миллер Алексей Борисович	\N	2026-04-08 10:28:13.734	2026-04-08 10:28:13.734	ПРЕДСЕДАТЕЛЬ ПРАВЛЕНИЯ	Действующая	Юридическое лицо	ПАО "ГАЗПРОМ"
156	АКЦИОНЕРНОЕ ОБЩЕСТВО "ВКУСНО И ТОЧКА"	4253052543	425301001	1224200009329	Кемеровская область - Кузбасс, г Новокузнецк, р-н Куйбышевский, ул Невского, д 1А, офис 304	\N	\N	\N	\N	Скурыгин Андрей Александрович	\N	2026-04-08 10:57:21.108	2026-04-08 10:57:21.108	ГЕНЕРАЛЬНЫЙ ДИРЕКТОР	Действующая	Юридическое лицо	АО "ВИТ"
157	ИП Водопьянов Владимир Александрович	312318044657	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 14:07:40.302	2026-04-08 14:07:40.302	\N	\N	\N	\N
158	ИП Головинов Алексей Витальевич	312328599640	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 17:51:20.327	2026-04-08 17:51:20.327	\N	\N	\N	\N
159	Индивидуальный предприниматель Савина Варвара Ивановна	310302439575	\N	323310000031590	Белгородская область, Белгородский район, Стрелецкий, с Стрелецкое	\N	\N	\N	\N	\N	\N	2026-04-09 08:02:24.548	2026-04-09 08:02:24.548	\N	Действующая	Индивидуальный предприниматель	ИП Савина Варвара Ивановна
163	ИП Чуева Инна Анатольевна	312300115900	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 11:07:06.045	2026-04-09 11:07:06.045	\N	\N	\N	\N
123	Индивидуальный предприниматель Свечкарь Галина Анатольевна	312302181545	\N	304312332200340	Респ Калмыкия, Приютненский р-н, поселок Первомайский, ул Первомайская	\N	\N	\N	\N	\N	\N	2026-04-06 11:21:44.69	2026-04-09 11:51:09.926	\N	Действующая	Индивидуальный предприниматель	ИП Свечкарь Галина Анатольевна
164	ИП Борисова Ксения Олеговна	312328826815	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 11:53:11.15	2026-04-09 11:53:11.15	\N	\N	\N	\N
155	АППАРАТ ГОСУДАРСТВЕННОЙ ДУМЫ ФЕДЕРАЛЬНОГО СОБРАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ	7707210781	770701001	1037700000293	г Москва, ул Охотный Ряд, д 1	\N	\N	\N	\N	Дивейкин Игорь Николаевич	\N	2026-04-08 10:55:29	2026-04-10 16:55:18.418	РУКОВОДИТЕЛЬ АППАРАТА ГОСУДАРСТВЕННОЙ ДУМЫ	Действующая	Юридическое лицо	ПАО "ГАЗПРОМ"
165	Контрагент ИНН 1111111111	1111111111	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 17:12:22.563	2026-04-10 17:14:00.955	\N	\N	\N	ИНН 1111111111
166	ИП Круликовский Максим Витальевич	312343428368	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 11:33:33.194	2026-04-13 11:33:33.194	\N	\N	\N	\N
\.


--
-- Data for Name: counterparty_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counterparty_balances (id, counterparty_id, total_billed, total_paid, balance, last_updated) FROM stdin;
3	53	19900	40300	-20400	2026-04-13 07:52:35.226
44	40	5000	600	4400	2026-04-13 07:52:35.168
109	103	29700	14850	14850	2026-04-13 07:52:35.391
84	79	8020	0	8020	2026-04-13 07:52:35.313
45	27	4780	0	4780	2026-04-13 07:52:35.171
1092	135	0	0	0	2026-04-13 07:52:35.462
409	117	7488	0	7488	2026-04-13 07:52:35.435
98	92	1800	0	1800	2026-04-13 07:52:35.359
104	100	1980	0	1980	2026-04-13 07:52:35.376
110	102	4590	4590	0	2026-04-13 07:52:35.394
111	105	35820	35820	0	2026-04-13 07:52:35.397
112	106	1800	1800	0	2026-04-13 07:52:35.4
114	108	0	0	0	2026-04-13 07:52:35.406
218	113	6150	6150	0	2026-04-13 07:52:35.421
12	35	25900	12050	13850	2026-04-13 07:52:35.175
692	118	1600	0	1600	2026-04-13 07:52:35.438
42	43	56700	32400	24300	2026-04-13 07:52:35.16
39	26	0	0	0	2026-04-13 07:52:35.148
882	119	2100	0	2100	2026-04-13 07:52:35.441
987	120	16230	0	16230	2026-04-13 07:52:35.444
11	70	7750	7720	30	2026-04-13 07:52:35.292
68	63	4180	0	4180	2026-04-13 07:52:35.256
49	30	0	0	0	2026-04-13 07:52:35.185
1089	124	0	0	0	2026-04-13 07:52:35.454
17	62	5940	9660	-3720	2026-04-13 07:52:35.207
69	66	8210	0	8210	2026-04-13 07:52:35.259
70	67	25720	0	25720	2026-04-13 07:52:35.263
60	51	8488	600	7888	2026-04-13 07:52:35.23
50	41	2120	0	2120	2026-04-13 07:52:35.19
10	52	51620	49650	1970	2026-04-13 07:52:35.211
113	107	3340	0	3340	2026-04-13 07:52:35.403
71	78	990	0	990	2026-04-13 07:52:35.266
1090	125	0	0	0	2026-04-13 07:52:35.456
95	89	3590	7200	-3610	2026-04-13 07:52:35.349
65	61	2000	0	2000	2026-04-13 07:52:35.247
96	91	6580	0	6580	2026-04-13 07:52:35.352
105	99	7640	0	7640	2026-04-13 07:52:35.379
219	114	3870	0	3870	2026-04-13 07:52:35.425
1091	132	8850	4450	4400	2026-04-13 07:52:35.459
81	68	6660	0	6660	2026-04-13 07:52:35.302
85	58	5000	0	5000	2026-04-13 07:52:35.317
16	54	3740	2900	840	2026-04-13 07:52:35.215
99	96	910	0	910	2026-04-13 07:52:35.362
310	116	0	0	0	2026-04-13 07:52:35.428
74	75	28790	0	28790	2026-04-13 07:52:35.276
24	65	2670	2670	0	2026-04-13 07:52:35.306
21	55	10000	14500	-4500	2026-04-13 07:52:35.219
67	48	29380	0	29380	2026-04-13 07:52:35.199
66	60	0	0	0	2026-04-13 07:52:35.25
53	18	5110	0	5110	2026-04-13 07:52:35.253
48	32	3600	400	3200	2026-04-13 07:52:35.182
23	77	5220	5820	-600	2026-04-13 07:52:35.27
73	76	15350	0	15350	2026-04-13 07:52:35.272
75	74	0	0	0	2026-04-13 07:52:35.278
2	73	29555	72505	-42950	2026-04-13 07:52:35.282
20	88	1940	2890	-950	2026-04-13 07:52:35.346
15	71	73840	107140	-33300	2026-04-13 07:52:35.288
62	57	28166	20854	7312	2026-04-13 07:52:35.237
80	69	3380	3380	0	2026-04-13 07:52:35.295
41	44	8370	0	8370	2026-04-13 07:52:35.156
36	31	5750	0	5750	2026-04-13 07:52:35.138
100	93	3640	0	3640	2026-04-13 07:52:35.365
83	64	6710	0	6710	2026-04-13 07:52:35.309
86	80	0	0	0	2026-04-13 07:52:35.32
27	81	2400	1600	800	2026-04-13 07:52:35.323
89	83	5160	0	5160	2026-04-13 07:52:35.329
90	82	1830	0	1830	2026-04-13 07:52:35.333
91	85	2700	0	2700	2026-04-13 07:52:35.336
92	86	6890	0	6890	2026-04-13 07:52:35.339
30	87	6240	15040	-8800	2026-04-13 07:52:35.343
97	90	5000	0	5000	2026-04-13 07:52:35.355
107	97	12000	12000	0	2026-04-13 07:52:35.385
101	94	4920	5720	-800	2026-04-13 07:52:35.368
102	95	2630	0	2630	2026-04-13 07:52:35.371
51	46	60730	24330	36400	2026-04-13 07:52:35.193
9	56	64905	79655	-14750	2026-04-13 07:52:35.241
103	101	0	0	0	2026-04-13 07:52:35.374
1093	155	0	0	0	2026-04-13 07:52:35.483
106	98	22275	23745	-1470	2026-04-13 07:52:35.382
64	59	200	0	200	2026-04-13 07:52:35.244
108	104	15000	19730	-4730	2026-04-13 07:52:35.388
214	109	6360	0	6360	2026-04-13 07:52:35.409
215	110	0	0	0	2026-04-13 07:52:35.411
216	111	0	0	0	2026-04-13 07:52:35.414
28	36	60600	23500	37100	2026-04-13 07:52:35.134
7	38	15100	12300	2800	2026-04-13 07:52:35.142
311	115	10640	5320	5320	2026-04-13 07:52:35.431
88	84	3580	0	3580	2026-04-13 07:52:35.326
52	47	0	0	0	2026-04-13 07:52:35.196
14	72	1850	1850	0	2026-04-13 07:52:35.285
40	45	8922	4280	4642	2026-04-13 07:52:35.152
61	49	29050	51900	-22850	2026-04-13 07:52:35.234
988	121	1780	0	1780	2026-04-13 07:52:35.448
989	122	950	0	950	2026-04-13 07:52:35.451
1094	156	0	0	0	2026-04-13 07:52:35.465
5	50	49140	86540	-37400	2026-04-13 07:52:35.204
217	112	2920	2920	0	2026-04-13 07:52:35.417
43	42	18500	5670	12830	2026-04-13 07:52:35.164
31	39	5500	2000	3500	2026-04-13 07:52:35.116
1095	157	0	0	0	2026-04-13 07:52:35.467
1096	158	950	0	950	2026-04-13 07:52:35.47
1097	159	1920	0	1920	2026-04-13 07:52:35.473
1098	163	0	0	0	2026-04-13 07:52:35.475
1088	123	0	0	0	2026-04-13 07:52:35.478
1225	164	0	950	-950	2026-04-13 07:52:35.48
8	34	5970	11300	-5330	2026-04-13 07:52:35.178
1	25	1740	1840	-100	2026-04-13 07:52:35.146
6	29	156950	153900	3050	2026-04-13 07:52:35.121
34	23	5070	0	5070	2026-04-13 07:52:35.13
4	33	49400	42850	6550	2026-04-13 07:52:35.127
1679	165	0	0	0	2026-04-13 07:52:35.486
\.


--
-- Data for Name: counterparty_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counterparty_contacts (id, counterparty_id, client_id, created_at) FROM stdin;
181	84	503	2026-03-25 13:00:25.082
65	31	260	2026-03-16 09:44:22.607
182	83	493	2026-03-25 13:00:28.456
183	82	492	2026-03-25 13:00:32.335
68	29	255	2026-03-16 09:55:40.655
70	33	266	2026-03-16 10:16:26.452
185	85	459	2026-03-25 13:04:20.369
187	86	512	2026-03-25 14:53:39.72
75	38	265	2026-03-16 12:36:50.423
189	87	518	2026-03-26 14:57:52.063
190	88	528	2026-03-26 15:37:53.803
192	89	402	2026-03-26 18:00:57.421
83	45	303	2026-03-17 09:44:53.436
84	44	298	2026-03-17 09:44:58.896
85	43	292	2026-03-17 09:45:05.436
86	42	285	2026-03-17 09:45:12.294
87	40	281	2026-03-17 09:45:19.906
88	39	263	2026-03-17 09:45:25.035
89	25	237	2026-03-17 09:45:41.37
90	26	240	2026-03-17 09:45:49.779
91	27	250	2026-03-17 09:45:57.25
92	35	202	2026-03-17 09:46:03.195
93	34	269	2026-03-17 09:46:08.655
94	32	262	2026-03-17 09:46:20.525
95	30	256	2026-03-17 09:46:26.125
195	91	535	2026-03-27 13:37:10.005
97	41	192	2026-03-17 10:47:58.877
196	90	397	2026-03-27 13:37:13.596
99	46	304	2026-03-17 11:12:45.415
100	47	312	2026-03-17 15:35:25.012
197	92	558	2026-03-27 13:58:03.669
201	93	606	2026-03-29 17:06:28.097
202	94	614	2026-03-30 06:05:00.616
203	95	615	2026-03-30 06:23:24.242
49	23	214	2026-03-15 09:39:55.282
106	50	342	2026-03-18 13:18:44.734
109	52	346	2026-03-18 15:01:42.732
210	101	648	2026-03-30 09:49:26.71
211	100	471	2026-03-30 09:49:34.553
212	99	631	2026-03-30 09:49:39.084
213	98	621	2026-03-30 09:49:42.498
214	97	198	2026-03-30 09:49:46.42
114	54	349	2026-03-19 05:59:56.828
115	55	350	2026-03-19 06:00:01.469
116	53	347	2026-03-19 06:00:06.857
117	51	257	2026-03-19 06:00:13.691
118	49	270	2026-03-19 06:00:21.318
215	96	613	2026-03-30 09:49:50.291
121	54	368	2026-03-19 10:19:17.734
219	104	674	2026-03-30 17:30:47.671
220	103	670	2026-03-30 17:30:54.948
126	57	362	2026-03-19 14:29:05.043
127	56	363	2026-03-19 14:29:09.712
128	59	376	2026-03-19 16:57:06.502
221	102	663	2026-03-30 17:31:01.953
222	105	655	2026-03-31 07:26:43.448
223	106	700	2026-03-31 09:03:54.198
132	62	389	2026-03-20 09:21:51.659
133	61	258	2026-03-20 09:21:54.381
134	60	306	2026-03-20 09:22:01.779
136	63	411	2026-03-21 20:37:56.971
225	107	709	2026-03-31 12:30:31.212
226	108	716	2026-03-31 13:56:14.893
139	66	245	2026-03-22 18:24:48.854
140	67	384	2026-03-22 19:06:42.331
227	109	723	2026-04-01 09:13:14.535
228	110	724	2026-04-01 09:20:44.254
229	111	729	2026-04-01 09:35:14.841
230	112	738	2026-04-01 13:57:01.377
231	113	749	2026-04-01 17:53:34.902
232	114	751	2026-04-01 18:38:56.015
148	66	435	2026-03-23 09:25:05.198
234	116	760	2026-04-02 08:31:23.546
235	115	757	2026-04-02 10:02:16.751
236	117	316	2026-04-02 10:13:17.576
237	118	785	2026-04-02 15:03:36.151
238	56	793	2026-04-03 06:53:34.518
239	84	797	2026-04-03 08:29:30.685
155	78	463	2026-03-24 03:43:39.423
156	77	460	2026-03-24 03:43:43.351
157	76	454	2026-03-24 03:43:47.437
158	75	436	2026-03-24 03:43:52.137
159	74	252	2026-03-24 03:43:58.285
160	73	439	2026-03-24 03:44:03.455
161	72	427	2026-03-24 03:44:07.89
162	71	430	2026-03-24 03:44:13.274
163	70	426	2026-03-24 03:44:18.707
164	69	423	2026-03-24 03:44:24.923
165	68	241	2026-03-24 03:44:30.641
166	65	283	2026-03-24 03:44:40.529
167	64	291	2026-03-24 03:44:46.059
240	36	273	2026-04-03 08:36:22.241
169	79	297	2026-03-24 09:12:43.151
170	58	375	2026-03-24 14:02:50.75
241	119	807	2026-04-03 11:57:02.228
242	120	725	2026-04-06 06:08:38.834
175	80	482	2026-03-24 17:02:28.081
243	121	845	2026-04-06 07:12:37.012
177	81	486	2026-03-25 08:38:19.576
244	122	853	2026-04-06 08:10:40.68
245	122	855	2026-04-06 08:38:27.34
247	124	869	2026-04-06 14:47:53.228
248	125	890	2026-04-07 07:55:02.969
249	132	254	2026-04-07 14:13:01.622
251	157	950	2026-04-08 14:07:40.306
252	158	952	2026-04-08 17:51:20.335
253	159	315	2026-04-09 08:02:24.548
254	163	966	2026-04-09 11:07:06.048
255	123	814	2026-04-09 11:51:09.926
256	164	970	2026-04-09 11:53:11.154
259	48	223	2026-04-12 15:37:13.062
260	18	186	2026-04-13 07:56:24.881
261	166	1013	2026-04-13 11:33:33.199
\.


--
-- Data for Name: delivery_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_schedules (id, destination, delivery_date, accept_days, created_at, city_id) FROM stdin;
204	WB Электросталь	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:58:46.002	17
205	WB Щербинка	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:59:05.858	25
206	WB Чехов - 2	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:59:13.639	27
207	WB Тула (Алексин)	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:59:23.886	1
208	WB Подольск	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:59:30.846	3
209	WB Коледино	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 08:59:36.947	12
211	WB Воронеж	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 09:00:16.928	7
117	WB Сарапул	2026-03-22 00:00:00	Понедельник: c 9:00 до 18:00 (16.03.2026), Вторник: c 9:00 до 15:00 (17.03.2026)	2026-03-13 12:23:26.09	4
118	WB Сарапул	2026-03-29 00:00:00	Понедельник: c 9:00 до 18:00 (23.03.2026), Вторник: c 9:00 до 15:00 (24.03.2026)	2026-03-13 12:23:48.55	4
212	WB Электросталь	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:00:42.365	17
213	WB Щербинка	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:00:50.062	25
121	WB Екатеринбург	2026-03-23 00:00:00	Понедельник: c 9:00 до 18:00 (16.03.2026), Вторник: c 9:00 до 15:00 (17.03.2026)	2026-03-13 12:25:36.47	13
122	WB Екатеринбург	2026-03-30 00:00:00	Понедельник: c 9:00 до 18:00 (23.03.2026), Вторник: c 9:00 до 15:00 (24.03.2026)	2026-03-13 12:26:13.293	13
226	WB Электросталь	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:06:36.725	17
227	WB Щербинка	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:06:54.477	25
228	WB Чехов - 2	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:07:01.541	27
229	WB Тула (Алексин)	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:07:07.685	1
231	WB Коледино	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:07:23.487	12
244	WB Тула (Алексин)	2026-04-03 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 18:00 (02.04.2026)	2026-03-27 09:13:18.882	1
253	WB Рязань	2026-04-04 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 15:00 (02.04.2026)	2026-03-27 09:21:10.923	14
255	WB Рязань	2026-04-18 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 09:21:51.971	14
256	WB Рязань	2026-04-25 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 09:22:10.389	14
257	WB Новосемейкино	2026-04-02 00:00:00	Пятница: c 9:00 до 18:00 (27.03.2026), Понедельник: c 9:00 до 18:00 (30.03.2026)	2026-03-27 09:23:08.687	16
258	WB Невинномысск	2026-04-02 00:00:00	Пятница: c 9:00 до 18:00 (27.03.2026), Понедельник: c 9:00 до 18:00 (30.03.2026)	2026-03-27 09:23:16.69	10
270	WB Краснодар	2026-04-24 00:00:00	Пятница: c 9:00 до 18:00 (17.04.2026), Понедельник: c 9:00 до 18:00 (20.04.2026)	2026-03-27 09:27:16.985	8
280	WB Курск	2026-04-07 00:00:00	07.04.2026 с 10:00 до 17:00	2026-03-27 09:33:51.4	2
282	WB Курск	2026-04-09 00:00:00	09.04.2026 с 10:00 до 17:00	2026-03-27 09:34:08.839	2
290	WB Сарапул	2026-04-12 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 09:38:36.334	4
305	Lamoda  Софьино	2026-04-04 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 15:00 (02.04.2026)	2026-03-27 10:34:52.414	29
306	OZON Домодедово	2026-04-04 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 15:00 (02.04.2026)	2026-03-27 10:35:12.532	31
307	OZON Софьино	2026-04-04 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 15:00 (02.04.2026)	2026-03-27 10:35:19.47	28
124	WB Краснодар	2026-03-26 00:00:00	Понедельник: c 9:00 до 18:00 (23.03.2026), Вторник: c 9:00 до 15:00 (24.03.2026)	2026-03-13 12:37:44.13	8
110	WB Электросталь	2026-03-29 00:00:00	Четверг: c 9:00 до 18:00 (26.03.2026), Пятница: c 9:00 до 15:00 (27.03.2026)	2026-03-13 12:11:05.291	17
112	WB Рязань	2026-03-28 00:00:00	Среда: c 9:00 до 18:00 (25.03.2026), Четверг: c 9:00 до 15:00 (26.03.2026)	2026-03-13 12:13:47.151	14
214	WB Чехов - 2	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:00:57.295	27
219	ОZON Воронеж	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:01:57.589	30
141	WB Коледино	2026-03-29 00:00:00	Четверг: c 9:00 до 18:00 (26.03.2026), Пятница: c 9:00 до 15:00 (27.03.2026)	2026-03-13 13:29:04.56	12
142	WB Подольск	2026-03-29 00:00:00	Четверг: c 9:00 до 18:00 (26.03.2026), Пятница: c 9:00 до 15:00 (27.03.2026)	2026-03-13 13:29:12.798	3
230	WB Подольск	2026-04-12 00:00:00	Четверг: c 9:00 до 18:00 (09.04.2026), Пятница: c 9:00 до 15:00 (10.04.2026)	2026-03-27 09:07:15.6	3
232	WB Электросталь	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:07:49.231	17
245	WB Тула (Алексин)	2026-04-10 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 18:00 (09.04.2026)	2026-03-27 09:13:52.935	1
246	WB Тула (Алексин)	2026-04-17 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 18:00 (16.04.2026)	2026-03-27 09:15:01.96	1
247	WB Тула (Алексин)	2026-04-24 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 18:00 (23.04.2026)	2026-03-27 09:15:24.114	1
248	WB Котовск	2026-04-01 00:00:00	Пятница: c 9:00 до 18:00 (27.03.2026), Понедельник: c 9:00 до 18:00 (30.03.2026)	2026-03-27 09:17:19.988	15
249	WB Котовск	2026-04-08 00:00:00	Пятница: c 9:00 до 18:00 (03.04.2026), Понедельник: c 9:00 до 18:00 (06.04.2026)	2026-03-27 09:18:07.431	15
259	WB Новосемейкино	2026-04-09 00:00:00	Пятница: c 9:00 до 18:00 (03.04.2026), Понедельник: c 9:00 до 18:00 (06.04.2026)	2026-03-27 09:23:48.011	16
262	WB Невинномысск	2026-04-16 00:00:00	Пятница: c 9:00 до 18:00 (10.04.2026), Понедельник: c 9:00 до 18:00 (13.04.2026)	2026-03-27 09:24:19.712	10
263	WB Новосемейкино	2026-04-23 00:00:00	Пятница: c 9:00 до 18:00 (17.04.2026), Понедельник: c 9:00 до 18:00 (20.04.2026)	2026-03-27 09:24:40.523	16
264	WB Невинномысск	2026-04-23 00:00:00	Пятница: c 9:00 до 18:00 (17.04.2026), Понедельник: c 9:00 до 18:00 (20.04.2026)	2026-03-27 09:24:46.951	10
269	WB Краснодар	2026-04-17 00:00:00	Пятница: c 9:00 до 18:00 (10.04.2026), Понедельник: c 9:00 до 18:00 (13.04.2026)	2026-03-27 09:26:42.737	8
153	WB Тула (Алексин)	2026-03-29 00:00:00	Четверг: c 9:00 до 18:00 (26.03.2026), Пятница: c 9:00 до 15:00 (27.03.2026)	2026-03-17 11:25:56.606	1
155	WB Тула (Алексин)	2026-03-28 00:00:00	Среда: c 9:00 до 18:00 (25.03.2026), Четверг: c 9:00 до 15:00 (26.03.2026)	2026-03-18 10:56:19.777	1
156	WB Тест	2026-03-31 00:00:00	2121222	2026-03-18 11:14:48.217	24
166	ОZON Воронеж	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-24 12:34:47.243	30
167	ОZON Воронеж	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-24 12:35:24.255	30
168	ОZON Воронеж	2026-04-22 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-24 12:35:49.264	30
171	WB Воронеж	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-24 12:37:20.688	7
172	WB Воронеж	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-24 12:37:38.715	7
173	WB Воронеж	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-24 12:38:01.807	7
175	WB Воронеж	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-24 12:39:08.603	7
181	WB Коледино	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:50:47.574	12
180	WB Электросталь	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:50:33.609	17
182	WB Тула (Алексин)	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:50:57.679	1
183	WB Подольск	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:51:13.684	3
184	WB Щербинка	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:51:20.935	25
185	ОZON Воронеж	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:51:52.903	30
186	WB Воронеж	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:52:01.733	7
187	WB Электросталь	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:53:12.879	17
188	WB Щербинка	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:53:28.936	25
189	WB Тула (Алексин)	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:53:37.626	1
190	WB Подольск	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:53:48.952	3
191	WB Коледино	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:53:56.431	12
194	WB Чехов - 2	2026-04-08 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 08:54:48.506	27
197	WB Щербинка	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:55:57.578	25
215	WB Тула (Алексин)	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:01:17.29	1
220	WB Электросталь	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:05:14.877	17
221	WB Щербинка	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:05:35.031	25
233	WB Щербинка	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:07:59.316	25
235	WB Тула (Алексин)	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:08:12.177	1
236	WB Подольск	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:08:21.868	3
237	WB Коледино	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:08:28.813	12
238	WB Электросталь	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:09:44.457	17
239	WB Щербинка	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:09:51.438	25
240	WB Чехов - 2	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:09:58.432	27
241	WB Тула (Алексин)	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:10:03.511	1
242	WB Подольск	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:10:12.027	3
243	WB Коледино	2026-04-26 00:00:00	Четверг: c 9:00 до 18:00 (23.04.2026), Пятница: c 9:00 до 15:00 (24.04.2026)	2026-03-27 09:10:22.35	12
250	WB Котовск	2026-04-15 00:00:00	Пятница: c 9:00 до 18:00 (10.04.2026), Понедельник: c 9:00 до 18:00 (13.04.2026)	2026-03-27 09:18:27.967	15
260	WB Невинномысск	2026-04-09 00:00:00	Пятница: c 9:00 до 18:00 (03.04.2026), Понедельник: c 9:00 до 18:00 (06.04.2026)	2026-03-27 09:23:55.098	10
271	WB Курск	2026-03-27 00:00:00	27.03.2026 с 10:00 до 17:00	2026-03-27 09:31:58.548	2
274	WB Курск	2026-03-31 00:00:00	31.03.2026 с 10:00 до 17:00	2026-03-27 09:32:34.16	2
275	WB Курск	2026-04-01 00:00:00	01.04.2026 с 10:00 до 17:00	2026-03-27 09:32:47.766	2
276	WB Курск	2026-04-02 00:00:00	02.04.2026 с 10:00 до 17:00	2026-03-27 09:32:59.308	2
277	WB Курск	2026-04-03 00:00:00	03.04.2026 с 10:00 до 17:00	2026-03-27 09:33:07.258	2
278	WB Курск	2026-04-04 00:00:00	04.04.2026 с 10:00 до 17:00	2026-03-27 09:33:16.877	2
279	WB Курск	2026-04-06 00:00:00	06.04.2026 с 10:00 до 17:00	2026-03-27 09:33:35.302	2
281	WB Курск	2026-04-08 00:00:00	08.04.2026 с 10:00 до 17:00	2026-03-27 09:34:00.344	2
283	WB Курск	2026-04-10 00:00:00	10.04.2026 с 10:00 до 17:00	2026-03-27 09:34:20.797	2
284	WB Курск	2026-04-11 00:00:00	11.04.2026 с 10:00 до 17:00	2026-03-27 09:34:31.946	2
285	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 09:35:29.24	13
286	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 09:36:09.419	13
287	WB Екатеринбург (Перспективная 14)	2026-04-20 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 09:36:39.613	13
291	WB Сарапул	2026-04-19 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 09:38:51.743	4
292	WB Сарапул	2026-04-26 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 09:39:04.721	4
298	WB Казань	2026-04-10 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 09:41:01.691	5
302	WB Волгоград	2026-04-24 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 09:41:47.116	9
299	WB Волгоград	2026-04-17 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 09:41:18.248	9
308	Яндекс Маркет (Софьино)	2026-04-04 00:00:00	Среда: c 9:00 до 18:00 (01.04.2026), Четверг: c 9:00 до 15:00 (02.04.2026)	2026-03-27 10:37:07.448	33
309	OZON Софьино	2026-04-11 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 15:00 (09.04.2026)	2026-03-27 10:37:33.775	28
310	OZON Домодедово	2026-04-11 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 15:00 (09.04.2026)	2026-03-27 10:37:40.713	31
311	Lamoda  Софьино	2026-04-11 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 15:00 (09.04.2026)	2026-03-27 10:37:48.791	29
312	Яндекс Маркет (Софьино)	2026-04-11 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 15:00 (09.04.2026)	2026-03-27 10:37:56.023	33
315	Lamoda  Софьино	2026-04-18 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 10:38:21.155	29
300	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-19 12:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 09:41:24.084	21
195	WB Чехов - 2	2026-04-01 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 08:55:09.091	27
196	WB Электросталь	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:55:47.75	17
198	WB Чехов - 2	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:56:04.935	27
199	WB Тула (Алексин)	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:56:13.714	1
200	WB Подольск	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:56:22.423	3
201	WB Коледино	2026-04-15 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 08:56:34.551	12
216	WB Подольск	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:01:25.156	3
217	WB Коледино	2026-04-29 00:00:00	Понедельник: c 9:00 до 18:00 (27.04.2026), Вторник: c 9:00 до 15:00 (28.04.2026)	2026-03-27 09:01:40.39	12
222	WB Чехов - 2	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:05:43.041	27
223	WB Тула (Алексин)	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:05:48.563	1
224	WB Подольск	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:05:57.002	3
225	WB Коледино	2026-04-05 00:00:00	Четверг: c 9:00 до 18:00 (02.04.2026), Пятница: c 9:00 до 15:00 (03.04.2026)	2026-03-27 09:06:04.407	12
234	WB Чехов - 2	2026-04-19 00:00:00	Четверг: c 9:00 до 18:00 (16.04.2026), Пятница: c 9:00 до 15:00 (17.04.2026)	2026-03-27 09:08:05.719	27
251	WB Котовск	2026-04-22 00:00:00	Пятница: c 9:00 до 18:00 (17.04.2026), Понедельник: c 9:00 до 18:00 (20.04.2026)	2026-03-27 09:19:22.047	15
252	WB Котовск	2026-04-29 00:00:00	Пятница: c 9:00 до 18:00 (24.04.2026), Понедельник: c 9:00 до 18:00 (27.04.2026)	2026-03-27 09:19:49.826	15
254	WB Рязань	2026-04-11 00:00:00	Среда: c 9:00 до 18:00 (08.04.2026), Четверг: c 9:00 до 15:00 (09.04.2026)	2026-03-27 09:21:34.001	14
261	WB Новосемейкино	2026-04-16 00:00:00	Пятница: c 9:00 до 18:00 (10.04.2026), Понедельник: c 9:00 до 18:00 (13.04.2026)	2026-03-27 09:24:12.917	16
265	WB Новосемейкино	2026-04-30 00:00:00	Пятница: c 9:00 до 18:00 (24.04.2026), Понедельник: c 9:00 до 18:00 (27.04.2026)	2026-03-27 09:25:02.318	16
266	WB Невинномысск	2026-04-30 00:00:00	Пятница: c 9:00 до 18:00 (24.04.2026), Понедельник: c 9:00 до 18:00 (27.04.2026)	2026-03-27 09:25:09.202	10
267	WB Краснодар	2026-04-03 00:00:00	Пятница: c 9:00 до 18:00 (27.03.2026), Понедельник: c 9:00 до 18:00 (30.03.2026)	2026-03-27 09:26:04.205	8
268	WB Краснодар	2026-04-10 00:00:00	Пятница: c 9:00 до 18:00 (03.04.2026), Понедельник: c 9:00 до 18:00 (06.04.2026)	2026-03-27 09:26:23.761	8
272	WB Курск	2026-03-28 00:00:00	28.03.2026 с 10:00 до 17:00	2026-03-27 09:32:09.746	2
273	WB Курск	2026-03-30 00:00:00	30.03.2026 с 10:00 до 17:00	2026-03-27 09:32:21.338	2
288	WB Екатеринбург (Перспективная 14)	2026-04-27 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 09:37:06.88	13
289	WB Сарапул	2026-04-05 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 09:38:23.114	4
293	WB Волгоград	2026-04-03 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 09:40:02.378	9
294	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-03 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 09:40:07.915	21
295	WB Казань	2026-04-03 00:00:00	Понедельник: c 9:00 до 18:00 (30.03.2026), Вторник: c 9:00 до 15:00 (31.03.2026)	2026-03-27 09:40:23.552	5
296	WB Волгоград	2026-04-10 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 09:40:40.533	9
297	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	Понедельник: c 9:00 до 18:00 (06.04.2026), Вторник: c 9:00 до 15:00 (07.04.2026)	2026-03-27 09:40:51.995	21
301	WB Казань	2026-04-17 00:00:00	Понедельник: c 9:00 до 18:00 (13.04.2026), Вторник: c 9:00 до 15:00 (14.04.2026)	2026-03-27 09:41:34.375	5
304	WB Казань	2026-04-24 00:00:00	Понедельник: c 9:00 до 18:00 (20.04.2026), Вторник: c 9:00 до 15:00 (21.04.2026)	2026-03-27 09:42:06.238	5
313	OZON Софьино	2026-04-18 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 10:38:07.777	28
314	OZON Домодедово	2026-04-18 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 10:38:14.245	31
316	Яндекс Маркет (Софьино)	2026-04-18 00:00:00	Среда: c 9:00 до 18:00 (15.04.2026), Четверг: c 9:00 до 15:00 (16.04.2026)	2026-03-27 10:38:28.393	33
317	OZON Софьино	2026-04-25 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 10:38:57.228	28
318	OZON Домодедово	2026-04-25 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 10:39:05.51	31
319	Lamoda  Софьино	2026-04-25 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 10:39:17.573	29
320	Яндекс Маркет (Софьино)	2026-04-25 00:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 10:39:25.633	33
303	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-26 12:00:00	Среда: c 9:00 до 18:00 (22.04.2026), Четверг: c 9:00 до 15:00 (23.04.2026)	2026-03-27 09:41:55.896	21
\.


--
-- Data for Name: delivery_schedules_fbs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_schedules_fbs (id, city_id, destination, delivery_date, accept_days, created_at) FROM stdin;
27	1	WB Курск FBS	2026-04-13 12:00:00	13.04.2026 с 10:00 до 17:00	2026-04-13 07:24:14.203
28	1	WB Курск FBS	2026-04-14 12:00:00	14.04.2026 с 10:00 до 17:00	2026-04-13 07:24:24.554
29	1	WB Курск FBS	2026-04-15 12:00:00	15.04.2026 с 10:00 до 17:00	2026-04-13 07:24:33.485
30	1	WB Курск FBS	2026-04-16 12:00:00	16.04.2026 с 10:00 до 17:00	2026-04-13 07:24:42.316
31	1	WB Курск FBS	2026-04-17 12:00:00	17.04.2026 с 10:00 до 17:00	2026-04-13 07:24:52.132
32	1	WB Курск FBS	2026-04-18 12:00:00	18.04.2026 с 10:00 до 17:00	2026-04-13 07:25:04.235
\.


--
-- Data for Name: delivery_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_types (id, name, note, created_at, updated_at) FROM stdin;
1	FBS	Fulfillment by Seller	2026-03-15 16:33:39.702	2026-03-15 16:33:39.702
2	FBO	Fulfillment by Operator	2026-03-15 16:33:39.702	2026-03-15 16:33:39.702
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit, price, amount) FROM stdin;
173	129	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
174	130	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	1	шт	4500	4500
175	131	Коробки — от 5 до 10 коробок, WB Екатеринбург	1	шт	7500	7500
176	132	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Средняя	1	шт	890	890
177	133	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	1	кор	850	850
197	153	WB Курск FBS FBS — 0.1	0.1	м³	200	200
198	154	WB Курск FBS FBS — 0.1	0.1	м³	200	200
199	155	WB Курск FBS FBS — 0.1	0.1	м³	200	200
200	156	WB Курск FBS FBS — 0.1	0.52	м³	200	1040
201	157	Доставка ФБС Курск	1	коробка	200	200
202	158	WB Курск FBS FBS — 0.1	0.65	м³	200	1300
203	159	Транспортные услуги по доставке ФБС г. Белгород - г. Курск	1.35	м³	200	2700
204	160	Транспортные услуги по доставке ФБС г. Белгород - г. Курск	1.35	м³	200	2700
205	161	Транспортные услуги по маршруту ФБС г. Белгород - г. Курск	1	коробка	840	840
206	162	Транспортные услуги ФБС по маршруту г. Белгород - г. Курск (17.03.2026 и 18.03.2026)	21	м³	200	4200
208	164	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
212	166	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
213	167	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.31	м³	200	620
159	115	WB Курск FBS FBS — 0.1	0.1	м³	200	200
214	168	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.5	м³	200	1000
215	169	WB Курск FBS FBS — 0.1	0.8	м³	200	1600
216	169	Забор груза с адреса до 12 коробок или до (1 м³)	1	руб	500	500
217	170	WB Курск FBS FBS — 0.1	0.6	м³	200	1200
218	170	Забор груза с адреса до 12 коробок или до (1 м³)	1	руб	500	500
219	171	Забор груза с адреса до 12 коробок или до (1 м³)	1	руб	500	500
220	171	Транспортные услуги по доставке ФБС г. Белгород - г. Курск 	1	шт	1600	1600
221	172	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
222	173	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
223	174	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
227	176	WB Курск FBS FBS — 0.1	0.13	м³	200	260
228	177	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
232	179	Транспортные услуги по маршруту г. Белгород - г. Тула - Палета  от 0 кг до 300 кг	2	шт	5300	10600
233	179	Паллетирование	2	руб.	275	550
234	179	Предоставление деревянного поддона	2	руб.	375	750
235	180	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.15	м³	200	300
236	181	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.8	м³	200	1600
237	182	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
238	183	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
239	184	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	1	кор	5500	5500
240	185	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — от 5 до 10 коробок	1	кор	4500	4500
241	186	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — от 5 до 10 коробок	1	кор	5250	5250
242	187	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
243	188	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	3	кор	950	2850
244	189	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	3	кор	900	2700
245	190	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	2	пал	5300	10600
246	190	Паллетирование	1	руб.	275	275
247	190	Предоставление деревянного поддона	1	руб.	375	375
248	190	Забор груза с адреса до 80 коробов (8 м³)	1	руб.	1350	1350
249	190	Помощь на выгрузке	36	рублей	10	360
250	191	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	4	кор	990	3960
251	192	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — от 5 до 10 коробок	1	кор	4750	4750
252	193	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	4	кор	900	3600
253	194	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
254	195	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
255	196	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
256	197	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
257	198	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
258	199	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
259	200	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.7	м³	200	1400
260	200	Забор груза с адреса	1	руб.	500	500
261	201	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.8	м³	200	1600
262	201	Забор груза с адреса	1	руб.	500	500
263	202	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
264	203	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
265	204	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.62	м³	200	1240
266	205	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Средняя	1	шт	890	890
267	206	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
268	207	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	1	кор	850	850
269	208	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
270	209	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.35	м³	200	700
271	210	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
272	211	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
273	212	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	3	м³	200	6000
274	212	Забор груза с адреса до 12 коробок или до (1 м³)	1	руб	500	500
275	213	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
276	214	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.9	м³	200	1800
277	215	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.13	м³	200	260
278	216	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.1	м³	200	2200
279	217	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
280	218	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.21	м³	200	420
281	219	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	200	200
282	220	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.725	м³	200	1450
283	221	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
284	222	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.15	м³	200	300
285	223	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	4	м³	200	800
286	224	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.15	м³	200	300
287	225	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.325	м³	200	650
288	226	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
289	227	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
290	228	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
291	229	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	шт	7540	7540
292	230	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.4	м³	200	800
293	231	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
294	232	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Палета  от 401 кг до 500 кг	1	шт	7312	7312
295	233	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  от 5 до 10 коробок	1	шт	5250	5250
296	234	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	1	кор	1100	1100
297	234	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	1	кор	1200	1200
298	235	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	1	шт	4500	4500
299	236	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	1	кор	990	990
300	237	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	1	кор	1040	1040
301	238	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	1	кор	1300	1300
302	239	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
303	240	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	1	кор	890	890
304	241	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	1	кор	850	850
305	242	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	1	кор	890	890
306	243	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Средняя	1	шт	1100	1100
307	244	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Палета — от 301 кг до 400 кг	2	пал	9300	18600
308	244	Помощь на выгрузке	32	руб.	10	320
309	244	Паллетирование	2	руб.	275	550
310	244	Предоставление деревянного поддона	2	руб.	375	750
311	245	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	2	кор	900	1800
312	246	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	3	кор	800	2400
313	247	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
314	247	Забор груза с адреса	1	руб.	500	500
315	248	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
316	249	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
317	250	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
318	251	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.5	м³	200	1000
319	252	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
320	253	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Маленькая	2	кор	700	1400
321	254	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	1	кор	1040	1040
322	255	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	8	м³	200	1600
323	256	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Маленькая	1	кор	1000	1000
324	257	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.45	м³	200	2900
325	258	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	1	пал	7900	7900
326	258	Паллетирование	1	руб.	275	275
327	258	Предоставление деревянного поддона	1	руб.	375	375
328	258	Помощь на выгрузке	36	шт	10	360
329	259	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Маленькая	2	кор	840	1680
330	259	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	1	шт	1040	1040
331	260	Помощь на выгрузке	7	руб.	10	70
332	260	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	1	шт	4500	4500
333	261	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	4	кор	990	3960
334	261	Помощь на выгрузке	4	руб.	10	40
335	262	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	3	кор	1040	3120
336	262	Помощь на выгрузке	3	руб.	10	30
337	263	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	3	кор	1200	3600
338	263	Помощь на выгрузке	3	руб.	10	30
339	264	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	3	кор	1040	3120
340	265	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	1	кор	990	990
341	266	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
342	267	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	1	кор	5500	5500
343	268	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — от 5 до 10 коробок	1	кор	5250	5250
344	269	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	1	кор	7500	7500
345	270	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	2	кор	990	1980
346	271	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	1	шт	940	940
347	272	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	1	кор	890	890
348	273	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
349	274	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — от 5 до 10 коробок	1	кор	5250	5250
350	275	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	1	кор	5500	5500
351	276	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
352	277	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.25	м³	200	500
353	277	Гофрокартон 60х40х40 (б/у 5ти слойные)	26	руб.	60	1560
354	278	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	2	пал	5300	10600
355	278	Помощь на выгрузке	30	руб.	10	300
356	278	Паллетирование	2	руб.	275	550
357	278	Предоставление деревянного поддона	2	руб.	375	750
358	279	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
359	280	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
360	281	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
361	282	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
362	283	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.51	м³	200	1020
363	284	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
364	285	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
365	286	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
366	287	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
367	287	Забор груза с адреса	1	руб.	500	500
368	288	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
369	289	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
370	290	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Маленькая	5	шт	650	3250
371	291	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
372	292	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.5	м³	200	1000
373	293	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	2	кор	890	1780
374	294	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Средняя	1	шт	1100	1100
375	295	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	1	кор	990	990
376	296	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
377	297	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
378	298	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
379	299	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
380	300	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	2	кор	890	1780
381	301	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	1	кор	890	890
382	302	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.47	м³	200	940
383	303	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
384	304	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
385	305	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
386	306	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.24	м³	200	480
387	307	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	200	200
388	308	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
389	309	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
390	310	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
391	311	Транспортные услуги по маршруту г. Белгород - г. Тула - Большая	2	коробка	900	1800
392	312	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
393	313	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
394	313	Забор груза с адреса	1	руб.	500	500
395	314	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
396	315	тест Коробка — Большая	1	кор	10	10
397	316	Транспортные услуги по маршруту г. Белгород - г. Курск - Палета  от 301 кг до 400 кг	1	шт	6000	6000
398	317	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.6	м³	200	1200
399	318	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Большая	6	шт	850	5100
400	319	Транспортные услуги по маршруту г. Белгород - г. Рязань Палета — от 0 кг до 300 кг	1	пал	6300	6300
401	319	Забор груза с адреса	1	руб.	1350	1350
402	319	Помощь на выгрузке	20	руб.	10	200
403	320	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	2	пал	5300	10600
404	320	Забор груза с адреса	1	руб.	1350	1350
405	320	Помощь на выгрузке	36	руб.	10	360
406	320	Паллетирование	2	руб.	275	550
407	320	Предоставление деревянного поддона	2	руб.	375	750
408	321	Транспортные услуги по маршруту г. Белгород - г. Тула - Палета  от 0 кг до 300 кг	2	шт	5300	10600
409	321	Паллетирование	2	руб.	275	550
410	321	Предоставление деревянного поддона	2	руб.	375	750
411	321	Помощь на выгрузке	30	шт	10	300
412	322	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 301 кг до 400 кг	1	пал	7312	7312
413	323	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	3	кор	900	2700
414	324	Помощь на выгрузке	8	руб.	10	80
415	324	Транспортные услуги по маршруту г. Белгород - г. Подольск - Коробка  от 5 до 10 коробок	1	шт	4750	4750
416	325	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	3	кор	900	2700
417	326	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Маленькая	1	кор	790	790
418	327	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	2	пал	5300	10600
419	327	Помощь на выгрузке	23	руб.	10	230
420	327	Паллетирование	2	руб.	275	550
421	327	Предоставление деревянного поддона	2	руб.	375	750
422	328	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	2	кор	990	1980
423	329	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
424	330	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	1	кор	890	890
425	331	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
426	332	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
427	333	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
428	334	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
429	335	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
430	336	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	4	кор	900	3600
431	337	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	1	шт	940	940
432	338	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	1	кор	750	750
433	339	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
434	340	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.6	м³	200	1200
435	341	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
436	342	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.38	м³	200	760
437	343	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
438	344	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	200	2700
442	346	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	3	кор	850	2550
443	347	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	1	кор	950	950
444	348	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 301 кг до 400 кг	1	пал	6350	6350
445	348	Помощь на выгрузке	16	руб.	10	160
446	348	Паллетирование	1	руб.	275	275
447	348	Предоставление деревянного поддона	1	руб.	375	375
448	349	Забор груза с адреса	1	руб.	1350	1350
449	349	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	1	шт	2700	2700
450	350	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	4	м³	2000	8000
451	350	Забор груза с адреса	1	руб.	500	500
452	351	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
453	352	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
454	353	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
455	354	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	2000	2700
456	355	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.32	м³	2000	640
457	356	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
458	357	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
459	358	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
460	359	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.14	м³	2000	280
461	360	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
462	361	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	2	шт	1040	2080
463	362	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	2	кор	990	1980
464	363	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	4	шт	1200	4800
465	363	Гофрокартон 60х40х40 	8	руб.	120	960
466	363	Распечатка (шк коробов или поставки)	1	руб.	50	50
467	363	Упаковка товара	1150	ед	11	12650
468	364	Транспортные услуги по маршруту г. Белгород - г. Тула Палета 	1	пал	8450	8450
469	364	Забор груза с адреса	1	руб.	1350	1350
470	365	Транспортные услуги по маршруту г. Белгород - г. Рязань Палета 	1	пал	9450	9450
471	366	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	3	м³	2000	6000
472	366	Забор груза с адреса	1	руб.	500	500
473	367	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 301 кг до 400 кг	1	пал	8900	8900
474	367	Помощь на выгрузке	1	руб.	200	200
475	367	Паллетирование	1	руб.	275	275
476	367	Предоставление деревянного поддона	1	руб.	375	375
477	368	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.26	м³	200	520
478	369	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
479	370	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.7	м³	200	1400
480	371	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
481	372	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	1	пал	7900	7900
482	372	Паллетирование	1	руб.	275	275
483	373	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
484	374	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
485	375	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	2000	2000
486	376	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
487	377	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	2000	2700
488	378	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
489	379	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
490	380	Транспортные услуги по маршруту г. Белгород - г. Воронеж - Коробка  Средняя	2	шт	750	1500
491	381	Забор груза с адреса	1	руб.	1350	1350
492	381	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Палета  от 0 кг до 300 кг	1	шт	8300	8300
493	381	Паллетирование	1	руб.	275	275
494	381	Предоставление деревянного поддона	1	руб.	375	375
495	381	Выгрузка/Cборка	1	рублей	200	200
496	382	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Палета — от 401 кг до 500 кг	1	пал	14000	14000
497	382	Выгрузка/Cборка	1	рублей	200	200
498	382	Паллетирование	1	руб.	275	275
499	382	Предоставление деревянного поддона	1	руб.	375	375
500	383	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	2000	2700
501	384	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	20
502	385	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Маленькая	1	кор	700	700
503	385	Помощь на выгрузке	1	шт	10	10
504	385	Помощь на выгрузке от 0.6м³до 1м³	1	шт	100	100
505	385	Помощь на выгрузке	1	шт	10	10
506	385	Помощь на выгрузке	1	шт	10	10
507	386	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — от 5 до 10 коробок	1	кор	6500	6500
508	387	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	1	кор	7500	7500
509	388	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	1	пал	5300	5300
510	388	Забор груза с адреса	1	руб.	1350	1350
511	388	Помощь на выгрузке	1	руб.	150	150
512	388	Паллетирование	1	руб.	275	275
513	389	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	5	кор	900	4500
514	390	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	1	пал	7900	7900
515	390	Помощь на выгрузке	1	руб.	200	200
516	390	Предоставление деревянного поддона	1	руб.	375	375
517	390	Паллетирование	1	руб.	275	275
518	391	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Большая	5	шт	990	4950
519	391	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Палета  от 401 кг до 500 кг	1	шт	9900	9900
520	391	Помощь на выгрузке	25	шт	10	250
521	391	Паллетирование	1	руб.	275	275
522	391	Предоставление деревянного поддона	1	руб.	375	375
523	392	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	2	кор	890	1780
524	392	Гофрокартон 60х40х40 (б/у 5ти слойные)	20	руб.	60	1200
525	393	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	4	кор	990	3960
526	394	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	1	кор	990	990
527	395	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	1	кор	990	990
528	396	Помощь на выгрузке	4	руб.	10	40
529	396	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Большая	4	шт	990	3960
530	397	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	2	кор	1040	2080
531	397	Помощь на выгрузке	2	руб.	10	20
532	398	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	1	кор	1040	1040
533	399	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Средняя	1	шт	940	940
534	400	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
535	400	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	1	шт	1040	1040
536	401	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	1	шт	1040	1040
537	402	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	4	кор	1040	4160
538	403	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
539	404	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Средняя	1	шт	890	890
540	404	Распечатка упаковочного листа паллеты	1	шт	50	50
541	405	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Большая	2	шт	990	1980
542	406	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	2	кор	990	1980
543	407	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Маленькая	1	кор	790	790
544	408	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Большая	1	шт	990	990
545	409	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Большая	2	шт	900	1800
546	410	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	2	кор	900	1800
547	411	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Маленькая	4	кор	840	3360
548	411	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	1	шт	940	940
549	412	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Маленькая	6	кор	700	4200
550	413	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	3	кор	900	2700
551	414	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	1	шт	5500	5500
552	415	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	1	шт	1200	1200
553	416	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	1	шт	1200	1200
554	417	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	1	кор	1100	1100
555	418	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	1	кор	1200	1200
556	419	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	4	кор	1200	4800
557	420	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Средняя	3	кор	1000	3000
558	421	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Средняя	1	кор	1000	1000
559	422	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	1	кор	890	890
560	423	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — от 5 до 10 коробок	1	кор	5250	5250
561	424	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Большая	1	кор	1140	1140
562	425	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
563	426	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	2	шт	900	1800
564	427	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	1	шт	900	900
565	428	Помощь на выгрузке	4	руб.	10	40
610	464	Помощь на выгрузке	3	рублей	10	30
566	428	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	4	шт	900	3600
567	429	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	2	кор	900	1800
568	430	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
569	430	Помощь на выгрузке	1	руб.	10	10
570	431	Помощь на выгрузке	4	руб.	10	40
571	431	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	4	шт	900	3600
572	432	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
573	433	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
574	434	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Маленькая	1	кор	750	750
575	435	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	2	кор	990	1980
576	436	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
577	437	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
578	438	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Большая	2	шт	990	1980
579	439	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
580	440	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
581	441	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Средняя	1	кор	940	940
582	442	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	1	шт	1040	1040
583	443	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	1	кор	890	890
584	444	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	1	кор	1200	1200
585	445	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
586	446	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
587	447	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
588	448	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	2	пал	5300	10600
589	448	Помощь на выгрузке	2	руб.	200	400
590	448	Паллетирование	2	руб.	275	550
591	448	Предоставление деревянного поддона	2	руб.	375	750
592	449	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2500	5000
593	449	Забор груза с адреса	1	руб.	500	500
594	450	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.46	м³	200	920
595	451	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.42	м³	200	840
596	452	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
597	452	Забор груза с адреса	1	руб.	500	500
598	453	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	2000	2700
599	454	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
600	455	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
601	456	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
602	457	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
603	458	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
604	459	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
605	460	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
606	461	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
607	462	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
608	463	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
609	464	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
611	465	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
612	466	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
613	467	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.6	м³	2000	1200
614	468	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	14	м³	200	2800
615	469	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.42	м³	2000	840
616	470	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.4	м³	2000	800
617	471	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — от 5 до 10 коробок	1	кор	5250	5250
618	471	Помощь на выгрузке	7	руб.	10	70
619	472	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.33	м³	200	660
620	473	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
621	474	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.15	м³	200	300
622	475	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
623	476	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
624	477	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
625	477	Помощь на выгрузке	1	шт	10	10
626	478	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
627	479	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	2	кор	890	1780
628	480	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — от 5 до 10 коробок	1	кор	660	660
629	481	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	1	кор	990	990
630	482	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	3	кор	850	2550
631	483	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — от 5 до 10 коробок	1	кор	4750	4750
632	484	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Маленькая	2	кор	750	1500
633	485	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	1	кор	850	850
634	486	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
635	487	Забор груза с адреса	1	руб.	1350	1350
636	487	Транспортные услуги по маршруту г. Белгород - г. Рязань - Палета  от 0 кг до 300 кг	1	шт	6300	6300
637	487	Паллетирование	1	руб.	275	275
638	487	Выгрузка/Cборка	1	рублей	200	200
639	488	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	1	пал	5300	5300
640	488	Паллетирование	1	руб.	275	275
641	488	Предоставление деревянного поддона	1	руб.	375	375
642	488	Выгрузка/Cборка	1	рублей	200	200
643	489	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
644	490	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
645	491	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
646	492	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	1	кор	750	750
647	493	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  от 5 до 10 коробок	1	шт	4300	4300
648	493	Помощь на выгрузке	5	рублей	10	50
649	494	Транспортные услуги по маршруту г. Белгород - г. Коледино - Коробка  Средняя	1	шт	850	850
650	495	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	1	кор	950	950
651	496	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
652	497	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	5	кор	990	4950
653	497	Гофрокартон 60х40х40 (б/у 5ти слойные)	5	руб.	120	600
654	497	Распечатка упаковочного листа паллеты	1	шт	50	50
655	497	Упаковка товара	700	ед	11	7700
896	696	Забор груза с адреса	1	руб.	800	800
656	498	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
657	499	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	1	кор	990	990
658	500	Транспортные услуги по маршруту г. Белгород - г. Щербинка	1	кор	6300	6300
659	500	Паллетирование	1	руб.	275	275
660	500	Предоставление деревянного поддона	1	руб.	375	375
661	500	Выгрузка/Cборка	1	рублей	200	200
662	501	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
663	501	Забор груза с адреса	1	руб.	500	500
664	502	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	3	м³	2000	6000
665	502	Забор груза с адреса	1	руб.	500	500
666	503	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
677	513	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Маленькая	3	кор	840	2520
678	514	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	3	шт	1040	3120
679	515	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	3	шт	1040	3120
680	516	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Средняя	1	шт	890	890
681	517	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	200	200
682	518	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.4	м³	200	800
683	519	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.41	м³	200	820
684	520	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
685	521	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	3	кор	850	2550
686	522	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
687	523	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
688	524	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
689	525	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
690	526	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
691	527	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
692	528	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
693	529	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
694	529	Забор груза с адреса	1	руб.	500	500
695	529	Помощь на выгрузке	20	руб.	10	200
696	530	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
697	530	Забор груза с адреса	1	руб.	500	500
698	531	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2500	5000
699	531	Забор груза с адреса	1	руб.	500	500
700	532	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.45	м³	200	900
701	533	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
702	534	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
703	535	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
704	536	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
705	537	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
706	538	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
707	539	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
708	540	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	8000	10800
709	541	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
710	541	Помощь на выгрузке	3	рублей	10	30
711	542	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	200	600
712	542	Помощь на выгрузке	3	рублей	10	30
897	696	Помощь на выгрузке	6	руб.	10	60
713	543	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.4	м³	2000	800
714	544	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.2	м³	2000	2400
715	545	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.15	м³	2000	300
716	546	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
717	547	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	2000	2000
719	549	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	2000	2000
720	550	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
721	551	Транспортные услуги по маршруту г. Белгород - г. Коледино Палета — от 0 кг до 300 кг	5	пал	6300	31500
722	551	Забор груза с адреса	1	руб.	1350	1350
723	552	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
726	555	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
727	556	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
728	557	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	3	м³	200	6000
729	558	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
730	559	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
761	590	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.01	м³	200	20
762	591	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.01	м³	200	20
763	592	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.01	м³	200	20
764	593	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.01	м³	200	20
765	594	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.01	м³	200	20
773	602	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
781	610	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
785	614	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
786	615	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	2000	2000
787	616	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	2	кор	950	1900
788	616	Помощь на выгрузке	2	руб.	10	20
789	617	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.52	м³	200	1040
790	618	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.5	м³	2000	1000
791	619	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.86	м³	2000	1720
792	620	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.75	м³	2000	3500
793	621	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
794	622	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	200	200
795	623	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.225	м³	200	450
796	624	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	4.05	м³	2000	8100
797	625	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
798	626	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
799	627	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
800	628	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
801	629	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
802	630	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
803	631	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
804	632	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
805	632	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
806	633	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.2	м³	200	400
807	634	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.86	м³	200	1720
808	635	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  от 5 до 10 коробок	1	шт	4300	4300
809	636	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
810	637	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
811	638	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	2	шт	900	1800
812	639	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
813	640	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	1	кор	890	890
814	641	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 0 кг до 300 кг	1	пал	6800	6800
815	641	Забор груза с адреса	1	руб.	1350	1350
816	641	Помощь на выгрузке	30	руб.	10	300
817	641	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  от 5 до 10 коробок	1	шт	5000	5000
818	641	Паллетирование	1	руб.	275	275
819	641	Предоставление деревянного поддона	1	руб.	375	375
820	642	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Большая	2	шт	990	1980
821	643	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	3	кор	950	2850
822	644	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	1	кор	950	950
823	645	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Маленькая	1	кор	750	750
824	646	Транспортные услуги по маршруту г. Белгород - г. Подольск Коробка — Маленькая	1	кор	750	750
825	647	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Большая	1	кор	1100	1100
826	648	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Маленькая	1	кор	840	840
827	649	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург - Коробка  Большая	1	шт	1040	1040
828	650	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Маленькая	1	кор	840	840
829	650	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Большая	1	кор	1040	1040
830	651	Помощь на выгрузке	8	руб.	10	80
831	651	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург - Коробка  от 5 до 10 коробок	1	шт	5500	5500
832	652	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Большая	12	кор	1040	12480
833	653	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	1	кор	2970	2970
834	653	Забор груза с адреса	1	руб.	1350	1350
835	654	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Маленькая	1	кор	790	790
836	655	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.144	м³	2000	288
837	656	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.144	м³	2000	288
838	657	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	1	пал	5300	5300
839	657	Помощь на выгрузке	27	руб.	10	270
840	657	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	1	шт	4500	4500
841	657	Забор груза с адреса до 80 коробов (8 м³)	1	руб.	1350	1350
842	657	Предоставление деревянного поддона	1	руб.	375	375
843	657	Паллетирование	1	руб.	275	275
844	658	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
845	659	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.141	м³	2000	282
846	660	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.325	м³	200	650
847	661	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
848	661	Забор груза с адреса	1	руб.	500	500
849	662	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1.35	м³	2000	2700
850	663	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
851	664	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	шт	2000	200
852	664	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	шт	2000	200
853	665	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	200	2000
854	665	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
855	666	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	шт	2000	200
856	666	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	шт	2000	200
857	667	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.13	м³	200	260
858	668	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.45	м³	200	900
859	669	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	2000	200
860	670	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.3	м³	2000	600
861	671	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	1	м³	1200	1200
862	672	WB Тула (Алексин) - Большая	1	место	900	900
863	673	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	6	кор	1200	7200
864	674	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Палета — от 401 кг до 500 кг	1	пал	14000	14000
865	674	Выгрузка/Cборка	1	рублей	200	200
866	674	Паллетирование	1	руб.	275	275
867	674	Предоставление деревянного поддона	1	руб.	375	375
868	675	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	1	кор	1100	1100
869	675	Помощь на выгрузке	1	руб.	10	10
870	676	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	1	кор	1200	1200
871	677	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	1	кор	850	850
872	678	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	1	кор	990	990
873	679	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Маленькая	1	кор	790	790
874	680	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	1	кор	990	990
875	681	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — от 5 до 10 коробок	1	кор	5250	5250
876	681	Помощь на выгрузке	7	руб.	10	70
877	682	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Маленькая	2	кор	790	1580
878	682	Помощь на выгрузке	2	руб.	10	20
879	683	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — 600	1	пал	10900	10900
880	683	Выгрузка/Cборка	1	рублей	200	200
881	684	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Средняя	1	шт	890	890
882	685	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	1	кор	890	890
883	685	Помощь на выгрузке	1	руб.	10	10
884	686	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	1	кор	800	800
885	687	Транспортные услуги по маршруту г. Белгород - г. Котовск Палета — 600	1	пал	8450	8450
886	687	Выгрузка/Cборка	1	рублей	200	200
887	688	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Средняя	6	шт	800	4800
888	689	Помощь на выгрузке	1	руб.	10	10
889	689	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Большая	1	шт	900	900
890	690	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.1	м³	200	200
891	691	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	3	кор	900	2700
892	692	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	4	кор	900	3600
893	693	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	1	кор	800	800
894	694	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	1	кор	1040	1040
895	695	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	1	кор	5500	5500
898	696	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	1	шт	5500	5500
902	699	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	4	кор	1040	4160
903	700	Помощь на выгрузке	26	руб.	10	260
904	700	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	1	шт	5500	5500
905	700	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Палета  от 301 кг до 400 кг	1	шт	9300	9300
906	700	Паллетирование	1	руб.	275	275
907	700	Предоставление деревянного поддона	1	руб.	375	375
899	697	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	3	шт	1040	3120
900	698	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	1	кор	940	940
901	698	Помощь на выгрузке	1	руб.	10	10
908	701	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	4	кор	1040	4160
909	702	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	1	кор	1040	1040
910	703	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	1	кор	7500	7500
911	704	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
912	704	Забор груза с адреса	1	руб.	500	500
913	705	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
914	705	Забор груза с адреса	1	руб.	500	500
915	706	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	4	м³	200	8000
916	706	Забор груза с адреса	1	руб.	500	500
917	707	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
918	707	Забор груза с адреса	1	руб.	500	500
919	707	Помощь на выгрузке	20	руб.	10	200
920	708	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
921	708	Забор груза с адреса	1	руб.	500	500
922	709	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	2	м³	2300	4600
923	709	Забор груза с адреса	1	руб.	500	500
924	710	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
925	711	Помощь на выгрузке	8	руб.	10	80
926	711	Забор груза с адреса	1	руб.	1350	1350
927	711	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	1	шт	4500	4500
928	712	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
929	713	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	3	кор	900	2700
930	714	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	1	кор	900	900
931	715	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	1	кор	800	800
932	715	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	4	кор	900	3600
933	716	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	3	кор	800	2400
934	717	Помощь на выгрузке	8	руб.	10	80
935	717	Транспортные услуги по маршруту г. Белгород - г. Рязань - Коробка  от 5 до 10 коробок	1	шт	4750	4750
936	718	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	1	кор	850	850
937	719	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	1	кор	950	950
938	720	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	1	кор	850	850
939	721	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	3	кор	850	2550
940	721	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	2	кор	950	1900
941	722	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Маленькая	1	кор	750	750
942	723	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	1	кор	4750	4750
943	724	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	1	кор	890	890
944	725	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Маленькая	1	кор	790	790
945	726	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 0 кг до 300 кг	2	пал	6771	13542
946	727	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	3	кор	890	2670
947	728	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — от 5 до 10 коробок	1	кор	5000	5000
948	729	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Средняя	4	шт	890	3560
949	729	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Маленькая	1	шт	790	790
950	730	WB Тула (Алексин) - от 301 кг до 400 кг	3	палета	6350	19050
951	730	Паллетирование	3	руб.	275	825
952	730	Предоставление деревянного поддона	3	руб.	375	1125
954	732	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — от 5 до 10 коробок	1	кор	5500	5500
955	733	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	0.5	м³	200	1000
956	733	Забор груза с адреса	1	руб.	500	500
957	733	Помощь на выгрузке	5	руб.	10	50
\.


--
-- Data for Name: invoice_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_requests (id, invoice_id, request_id, created_at) FROM stdin;
3	610	847	2026-04-08 11:42:35.041
7	614	853	2026-04-08 12:47:56.472
8	615	856	2026-04-08 14:33:54.562
9	616	860	2026-04-09 08:04:33.414
10	617	796	2026-04-09 08:39:40.05
11	618	866	2026-04-09 08:41:52.35
12	619	867	2026-04-09 08:43:03.311
13	620	868	2026-04-09 08:45:18.429
14	621	795	2026-04-09 09:16:19.886
15	622	794	2026-04-09 09:19:10.271
16	623	792	2026-04-09 09:23:29.33
17	624	869	2026-04-09 09:26:33.348
18	625	849	2026-04-09 09:29:46.918
19	626	843	2026-04-09 09:33:10.563
20	627	797	2026-04-09 09:33:37.761
21	628	767	2026-04-09 09:33:56.671
22	629	803	2026-04-09 09:35:28.533
23	630	782	2026-04-09 09:35:44.488
24	631	741	2026-04-09 09:36:56.399
25	632	808	2026-04-09 09:37:49.427
26	633	752	2026-04-09 09:38:51.764
27	634	765	2026-04-09 09:40:14.189
28	635	761	2026-04-09 10:19:19.268
29	636	787	2026-04-09 10:24:26.988
30	637	770	2026-04-09 10:24:36.344
31	638	763	2026-04-09 10:24:44.753
32	639	711	2026-04-09 10:25:49.592
33	640	793	2026-04-09 10:26:40.761
34	641	784	2026-04-09 10:27:45.471
35	642	764	2026-04-09 10:28:14.923
36	643	790	2026-04-09 10:29:12.918
37	644	751	2026-04-09 10:29:28.104
38	645	681	2026-04-09 10:30:01.23
39	646	726	2026-04-09 10:32:07.165
40	647	775	2026-04-09 10:50:39.926
41	648	776	2026-04-09 10:51:13.527
42	649	762	2026-04-09 10:51:47.738
43	650	729	2026-04-09 10:52:08.477
44	651	696	2026-04-09 10:53:10.644
45	652	723	2026-04-09 10:56:16.646
46	653	703	2026-04-09 11:00:55.182
47	654	786	2026-04-09 11:01:10.639
48	655	865	2026-04-09 11:19:13.338
49	656	881	2026-04-09 12:48:15.597
50	657	791	2026-04-09 12:53:54.766
51	658	882	2026-04-09 12:59:41.875
52	659	883	2026-04-09 13:02:38.62
53	660	878	2026-04-09 13:03:23.569
54	661	870	2026-04-09 13:06:50.905
55	662	884	2026-04-09 13:07:43.993
56	663	873	2026-04-09 13:08:18.699
57	664	886	2026-04-09 13:21:51.647
58	664	885	2026-04-09 13:21:51.647
59	665	877	2026-04-09 13:22:30.983
60	666	886	2026-04-09 13:29:38.51
61	666	885	2026-04-09 13:29:38.51
62	667	887	2026-04-09 13:30:03.971
63	668	880	2026-04-09 13:30:37.419
64	669	888	2026-04-09 13:31:53.969
65	670	889	2026-04-09 13:36:37.812
66	671	861	2026-04-09 13:55:58.666
67	672	895	2026-04-10 07:37:33.645
68	673	766	2026-04-10 08:18:00.144
69	674	742	2026-04-10 08:18:53.193
70	675	734	2026-04-10 08:19:39.17
71	676	712	2026-04-10 08:20:28.448
72	677	748	2026-04-10 08:23:10.658
73	678	744	2026-04-10 08:24:11.206
74	679	680	2026-04-10 08:26:03.82
75	680	678	2026-04-10 08:26:44.667
76	681	673	2026-04-10 08:28:24.786
77	682	802	2026-04-10 08:35:15.225
78	683	757	2026-04-10 08:36:23.447
79	684	745	2026-04-10 08:38:01.486
80	685	733	2026-04-10 08:40:19.417
81	686	771	2026-04-10 08:42:00.181
82	687	756	2026-04-10 08:42:38.182
83	688	755	2026-04-10 08:44:52.433
84	689	731	2026-04-10 08:47:23.51
85	690	898	2026-04-10 08:48:10.546
86	691	728	2026-04-10 08:48:15.072
87	692	702	2026-04-10 08:49:02.416
88	693	625	2026-04-10 08:50:25.902
89	694	769	2026-04-10 08:53:07.858
90	695	747	2026-04-10 08:53:52.312
91	696	743	2026-04-10 08:55:06.664
92	697	736	2026-04-10 08:55:47.685
93	698	732	2026-04-10 08:56:33.305
94	699	730	2026-04-10 08:57:14.349
95	700	727	2026-04-10 08:58:26.585
96	701	706	2026-04-10 08:59:48.181
97	702	693	2026-04-10 09:01:41.107
98	703	746	2026-04-10 09:04:54.623
99	704	801	2026-04-10 09:10:51.12
100	705	783	2026-04-10 09:12:03.468
101	706	737	2026-04-10 09:19:32.71
102	707	713	2026-04-10 09:23:29.802
103	708	871	2026-04-10 09:26:55.094
104	709	872	2026-04-10 09:27:45.153
105	710	900	2026-04-10 12:40:04.934
106	711	897	2026-04-10 12:41:14.86
107	712	894	2026-04-10 12:42:24.512
108	713	890	2026-04-10 12:42:51.22
109	714	875	2026-04-10 12:45:18.03
110	715	799	2026-04-10 12:47:02.549
111	716	789	2026-04-10 12:48:23.466
112	717	891	2026-04-10 12:52:31.776
113	718	863	2026-04-10 12:54:48.309
114	719	858	2026-04-10 12:55:36.161
115	720	854	2026-04-10 12:56:13.308
116	721	798	2026-04-10 12:56:51.464
117	722	694	2026-04-10 12:57:34.476
118	723	806	2026-04-10 12:58:08.095
119	724	893	2026-04-10 12:59:11.072
120	725	876	2026-04-10 13:00:10.316
121	726	864	2026-04-10 13:01:42.946
122	727	788	2026-04-10 13:02:37.282
123	728	739	2026-04-10 13:03:49.397
124	729	879	2026-04-10 13:04:34.299
125	730	908	2026-04-10 13:23:43.387
127	732	481	2026-04-13 11:00:56.576
128	733	935	2026-04-13 12:05:09.275
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, number, date, counterparty_id, created_at, updated_at, is_paid, paid_at, amount, status, tbank_order_id, tbank_payment_id, tbank_payment_url) FROM stdin;
160	СЧ-000160	2026-03-18 14:17:04.407	43	2026-03-18 14:17:04.408	2026-03-18 14:17:04.408	f	\N	0	new	\N	\N	\N
115	СЧ-000115	2026-03-17 09:24:23.566	38	2026-03-17 09:24:23.566	2026-03-17 09:24:23.566	f	\N	0	new	\N	\N	\N
291	СЧ-000291	2026-03-26 08:40:08.565	43	2026-03-26 08:40:08.567	2026-03-26 08:40:08.567	f	\N	0	new	\N	\N	\N
201	СЧ-000201	2026-03-21 10:20:56.276	29	2026-03-21 10:20:56.277	2026-03-21 10:20:56.277	f	\N	0	new	\N	\N	\N
440	СЧ-000440	2026-04-02 07:30:29.501	112	2026-04-02 07:30:29.502	2026-04-02 07:30:29.502	f	\N	0	new	\N	\N	\N
218	СЧ-000218	2026-03-24 03:37:21.103	38	2026-03-24 03:37:21.104	2026-03-24 03:37:27.124	f	\N	0	awaiting_payment	INV-218-1774323446938	8201522882	https://pay.tbank.ru/ZryM6p1o
219	СЧ-000219	2026-03-24 03:38:42.724	50	2026-03-24 03:38:42.725	2026-03-24 03:38:42.725	f	\N	0	new	\N	\N	\N
187	СЧ-000187	2026-03-20 13:28:03.786	42	2026-03-20 13:28:03.787	2026-03-20 13:28:03.787	f	\N	0	new	\N	\N	\N
447	СЧ-000447	2026-04-02 07:34:08.044	94	2026-04-02 07:34:08.045	2026-04-02 07:34:08.045	f	\N	0	new	\N	\N	\N
174	СЧ-000174	2026-03-19 13:46:49.712	49	2026-03-19 13:46:49.713	2026-03-19 13:46:50.763	f	\N	0	awaiting_payment	INV-174-1773928010495	8175687492	https://pay.tbank.ru/My2O4z6F
176	СЧ-000176	2026-03-19 14:19:43.955	50	2026-03-19 14:19:43.956	2026-03-19 14:19:43.956	f	\N	0	new	\N	\N	\N
177	СЧ-000177	2026-03-19 14:20:08.365	50	2026-03-19 14:20:08.367	2026-03-19 14:20:08.367	f	\N	0	new	\N	\N	\N
129	СЧ-000129	2026-03-18 08:39:46.314	38	2026-03-18 08:39:46.315	2026-03-18 08:39:46.315	f	\N	0	new	\N	\N	\N
130	СЧ-000130	2026-03-18 08:40:57.638	35	2026-03-18 08:40:57.639	2026-03-18 08:40:57.639	f	\N	0	new	\N	\N	\N
131	СЧ-000131	2026-03-18 08:42:26.162	33	2026-03-18 08:42:26.166	2026-03-18 08:42:26.166	f	\N	0	new	\N	\N	\N
132	СЧ-000132	2026-03-18 08:44:32.779	25	2026-03-18 08:44:32.782	2026-03-18 08:44:32.782	f	\N	0	new	\N	\N	\N
133	СЧ-000133	2026-03-18 08:45:45.353	25	2026-03-18 08:45:45.354	2026-03-18 08:45:45.354	f	\N	0	new	\N	\N	\N
297	СЧ-000297	2026-03-26 09:50:00.065	67	2026-03-26 09:50:00.066	2026-03-26 09:50:00.066	f	\N	0	new	\N	\N	\N
155	СЧ-000155	2026-03-18 13:32:13.508	49	2026-03-18 13:32:13.509	2026-03-18 13:32:15.038	f	\N	0	awaiting_payment	INV-155-1773840734792	8169809483	https://pay.tbank.ru/pZPCJQKV
156	СЧ-000156	2026-03-18 13:32:39.084	33	2026-03-18 13:32:39.085	2026-03-18 13:32:39.085	f	\N	0	new	\N	\N	\N
202	СЧ-000202	2026-03-21 10:26:37.249	45	2026-03-21 10:26:37.25	2026-03-21 10:26:37.25	f	\N	0	new	\N	\N	\N
157	СЧ-000157	2026-03-18 13:39:50.402	49	2026-03-18 13:39:50.403	2026-03-18 13:40:03.744	f	\N	0	awaiting_payment	INV-157-1773841203555	8169847362	https://pay.tbank.ru/17oBEmKk
191	СЧ-000191	2026-03-20 13:59:55.424	62	2026-03-20 13:59:55.425	2026-03-20 13:59:55.425	f	\N	0	new	\N	\N	\N
192	СЧ-000192	2026-03-20 14:07:00.11	52	2026-03-20 14:07:00.111	2026-03-20 14:07:00.111	f	\N	0	new	\N	\N	\N
193	СЧ-000193	2026-03-20 14:07:54.697	52	2026-03-20 14:07:54.698	2026-03-20 14:07:54.698	f	\N	0	new	\N	\N	\N
179	СЧ-000178	2026-03-20 07:07:31.283	46	2026-03-20 07:07:31.285	2026-03-20 07:07:32.815	f	\N	0	awaiting_payment	INV-179-1773990452556	8179391325	https://pay.tbank.ru/RDMbJnXV
196	СЧ-000196	2026-03-20 14:21:19.285	35	2026-03-20 14:21:19.286	2026-03-20 14:21:19.286	f	\N	0	new	\N	\N	\N
167	СЧ-000167	2026-03-19 13:06:51.263	33	2026-03-19 13:06:51.264	2026-03-19 13:06:51.264	f	\N	0	new	\N	\N	\N
159	СЧ-000159	2026-03-18 14:16:35.574	43	2026-03-18 14:16:35.575	2026-03-18 14:16:35.575	f	\N	0	new	\N	\N	\N
161	СЧ-000161	2026-03-18 15:11:17.968	33	2026-03-18 15:11:17.969	2026-03-18 15:11:17.969	f	\N	0	new	\N	\N	\N
162	СЧ-000162	2026-03-18 15:21:13.038	53	2026-03-18 15:21:13.039	2026-03-18 15:21:13.039	f	\N	0	new	\N	\N	\N
169	СЧ-000169	2026-03-19 13:22:48.205	29	2026-03-19 13:22:48.206	2026-03-19 13:22:48.206	f	\N	0	new	\N	\N	\N
181	СЧ-000181	2026-03-20 09:25:21.782	35	2026-03-20 09:25:21.783	2026-03-20 09:25:21.783	f	\N	0	new	\N	\N	\N
170	СЧ-000170	2026-03-19 13:23:21.729	29	2026-03-19 13:23:21.73	2026-03-19 13:23:21.73	f	\N	0	new	\N	\N	\N
171	СЧ-000171	2026-03-19 13:29:12.673	29	2026-03-19 13:29:12.674	2026-03-19 13:29:12.674	f	\N	0	new	\N	\N	\N
188	СЧ-000188	2026-03-20 13:34:26.997	35	2026-03-20 13:34:26.998	2026-03-20 13:34:26.998	f	\N	0	new	\N	\N	\N
189	СЧ-000189	2026-03-20 13:35:37.812	42	2026-03-20 13:35:37.813	2026-03-20 13:35:37.813	f	\N	0	new	\N	\N	\N
190	СЧ-000190	2026-03-20 13:41:38.406	56	2026-03-20 13:41:38.408	2026-03-20 13:41:38.408	f	\N	0	new	\N	\N	\N
197	СЧ-000197	2026-03-20 15:04:13.918	40	2026-03-20 15:04:13.919	2026-03-20 15:04:15.287	f	\N	0	awaiting_payment	INV-197-1774019055030	8182277032	https://pay.tbank.ru/TVA7Ko0T
194	СЧ-000194	2026-03-20 14:18:56.884	49	2026-03-20 14:18:56.885	2026-03-20 14:18:58.244	f	\N	0	awaiting_payment	INV-194-1774016337998	8182002215	https://pay.tbank.ru/m0p0p9Xj
185	СЧ-000185	2026-03-20 13:17:09.501	36	2026-03-20 13:17:09.502	2026-03-20 13:17:09.502	f	\N	0	new	\N	\N	\N
195	СЧ-000195	2026-03-20 14:19:58.576	38	2026-03-20 14:19:58.577	2026-03-20 14:20:00.322	f	\N	0	awaiting_payment	INV-195-1774016399974	8182008341	https://pay.tbank.ru/KUzNdwCk
200	СЧ-000200	2026-03-20 15:07:30.196	29	2026-03-20 15:07:30.197	2026-03-20 15:07:30.197	f	\N	0	new	\N	\N	\N
203	СЧ-000203	2026-03-21 11:02:40.239	43	2026-03-21 11:02:40.24	2026-03-21 11:02:40.24	f	\N	0	new	\N	\N	\N
204	СЧ-000204	2026-03-21 11:27:55.367	33	2026-03-21 11:27:55.368	2026-03-21 11:27:55.368	f	\N	0	new	\N	\N	\N
206	СЧ-000206	2026-03-23 06:30:49.472	69	2026-03-23 06:30:49.473	2026-03-23 06:30:49.473	f	\N	0	new	\N	\N	\N
207	СЧ-000207	2026-03-23 06:31:11.691	69	2026-03-23 06:31:11.692	2026-03-23 06:31:11.692	f	\N	0	new	\N	\N	\N
208	СЧ-000208	2026-03-23 10:49:37.383	43	2026-03-23 10:49:37.384	2026-03-23 10:49:37.384	f	\N	0	new	\N	\N	\N
209	СЧ-000209	2026-03-23 10:53:11.318	33	2026-03-23 10:53:11.319	2026-03-23 10:53:11.319	f	\N	0	new	\N	\N	\N
210	СЧ-000210	2026-03-23 10:57:17.562	45	2026-03-23 10:57:17.563	2026-03-23 10:57:17.563	f	\N	0	new	\N	\N	\N
441	СЧ-000441	2026-04-02 07:30:49.469	112	2026-04-02 07:30:49.47	2026-04-02 07:30:49.47	f	\N	0	new	\N	\N	\N
233	СЧ-000233	2026-03-25 08:47:47.123	35	2026-03-25 08:47:47.124	2026-03-25 08:47:47.124	f	\N	0	new	\N	\N	\N
186	СЧ-000186	2026-03-20 13:17:58.019	36	2026-03-20 13:17:58.02	2026-04-11 18:03:38.103	t	2026-03-20 18:02:22.047	0	paid	INV-186-1774012678793	8181638631	https://pay.tbank.ru/gTEMFFpa
220	СЧ-000220	2026-03-24 04:06:29.197	39	2026-03-24 04:06:29.198	2026-04-12 04:12:59.378	t	2026-03-24 04:11:19.98	0	paid	INV-220-1774325195713	8201616469	https://pay.tbank.ru/QxjUysv5
184	СЧ-000184	2026-03-20 12:08:19.359	36	2026-03-20 12:08:19.36	2026-04-12 13:00:37.642	t	2026-03-20 12:59:27.88	0	paid	INV-184-1774008500490	8181193884	https://pay.tbank.ru/1QFpBxZc
172	СЧ-000172	2026-03-19 13:30:45.883	32	2026-03-19 13:30:45.884	2026-04-12 13:43:16.978	t	2026-03-19 13:41:42.715	0	paid	INV-172-1773927047086	8175604299	https://pay.tbank.ru/lXkspp7z
168	СЧ-000168	2026-03-19 13:07:23.977	39	2026-03-19 13:07:23.978	2026-04-12 13:48:06.083	t	2026-03-19 13:46:53.631	0	paid	INV-168-1773925645250	8175479816	https://pay.tbank.ru/MDTrWLj7
154	СЧ-000154	2026-03-18 13:31:57.086	31	2026-03-18 13:31:57.087	2026-04-12 13:54:49.901	t	2026-03-18 13:53:39.401	0	paid	INV-154-1773840718258	8169808046	https://pay.tbank.ru/P3w4hR29
158	СЧ-000158	2026-03-18 13:53:36.595	51	2026-03-18 13:53:36.596	2026-04-12 13:56:07.475	t	2026-03-18 13:54:56.329	0	paid	INV-158-1773842018180	8169911214	https://pay.tbank.ru/UvmKxE0B
166	СЧ-000165	2026-03-19 12:57:33.789	40	2026-03-19 12:57:33.79	2026-04-12 13:57:23.256	t	2026-03-19 13:56:13.255	0	paid	INV-166-1773925055037	8175425761	https://pay.tbank.ru/kFftBsgJ
198	СЧ-000198	2026-03-20 15:06:33.256	32	2026-03-20 15:06:33.257	2026-04-12 15:11:04.36	t	2026-03-20 15:09:46.008	0	paid	INV-198-1774019194272	8182291602	https://pay.tbank.ru/I7NWFMth
199	СЧ-000199	2026-03-20 15:07:04.895	58	2026-03-20 15:07:04.896	2026-04-12 15:19:46.81	t	2026-03-20 15:18:35.485	0	paid	INV-199-1774019225865	8182294791	https://pay.tbank.ru/LjqC4H11
211	СЧ-000211	2026-03-23 17:45:25.355	43	2026-03-23 17:45:25.355	2026-03-23 17:45:25.355	f	\N	0	new	\N	\N	\N
212	СЧ-000212	2026-03-23 17:46:33.284	29	2026-03-23 17:46:33.285	2026-03-23 17:46:33.285	f	\N	0	new	\N	\N	\N
231	СЧ-000231	2026-03-24 16:36:30.184	50	2026-03-24 16:36:30.185	2026-03-24 16:36:30.185	f	\N	0	new	\N	\N	\N
214	СЧ-000214	2026-03-23 18:07:42.642	33	2026-03-23 18:07:42.643	2026-03-23 18:07:42.643	f	\N	0	new	\N	\N	\N
215	СЧ-000215	2026-03-23 18:09:38.014	50	2026-03-23 18:09:38.015	2026-03-23 18:09:38.015	f	\N	0	new	\N	\N	\N
216	СЧ-000216	2026-03-23 18:22:27.582	53	2026-03-23 18:22:27.584	2026-03-23 18:22:27.584	f	\N	0	new	\N	\N	\N
229	СЧ-000229	2026-03-24 12:06:40.739	50	2026-03-24 12:06:40.739	2026-03-24 12:06:40.739	f	\N	0	new	\N	\N	\N
292	СЧ-000292	2026-03-26 08:49:43.863	53	2026-03-26 08:49:43.864	2026-03-26 08:49:43.864	f	\N	0	new	\N	\N	\N
255	СЧ-000255	2026-03-25 10:12:08.348	81	2026-03-25 10:12:08.349	2026-03-25 10:12:08.349	f	\N	0	new	\N	\N	\N
223	СЧ-000223	2026-03-24 04:13:46.537	45	2026-03-24 04:13:46.538	2026-03-24 04:13:46.538	f	\N	0	new	\N	\N	\N
235	СЧ-000235	2026-03-25 09:20:40.688	67	2026-03-25 09:20:40.69	2026-03-25 09:20:40.69	f	\N	0	new	\N	\N	\N
301	СЧ-000301	2026-03-26 10:22:41.161	65	2026-03-26 10:22:41.162	2026-03-26 10:22:41.162	f	\N	0	new	\N	\N	\N
232	СЧ-000232	2026-03-25 07:11:22.947	57	2026-03-25 07:11:22.948	2026-03-25 07:11:22.948	f	\N	0	new	\N	\N	\N
230	СЧ-000230	2026-03-24 13:11:22.532	33	2026-03-24 13:11:22.533	2026-03-24 13:11:22.533	f	\N	0	new	\N	\N	\N
239	СЧ-000239	2026-03-25 09:22:42.652	70	2026-03-25 09:22:42.653	2026-03-25 09:22:42.653	f	\N	0	new	\N	\N	\N
247	СЧ-000247	2026-03-25 09:34:28.975	29	2026-03-25 09:34:28.976	2026-03-25 09:34:28.976	f	\N	0	new	\N	\N	\N
294	СЧ-000294	2026-03-26 09:42:20.615	83	2026-03-26 09:42:20.616	2026-03-26 09:42:21.558	f	\N	0	awaiting_payment	INV-294-1774518141309	8215391276	https://pay.tbank.ru/cIHmbBlN
228	СЧ-000228	2026-03-24 11:53:38.372	31	2026-03-24 11:53:38.373	2026-03-24 11:53:39.341	f	\N	0	awaiting_payment	INV-228-1774353219090	8203882379	https://pay.tbank.ru/UHZYAGGL
248	СЧ-000248	2026-03-25 09:35:08.955	40	2026-03-25 09:35:08.956	2026-03-25 09:35:08.956	f	\N	0	new	\N	\N	\N
298	СЧ-000298	2026-03-26 09:50:29.372	36	2026-03-26 09:50:29.373	2026-03-26 09:50:31.082	f	\N	0	awaiting_payment	INV-298-1774518630848	8215437492	https://pay.tbank.ru/mpKRDhSt
243	СЧ-000243	2026-03-25 09:24:59.984	72	2026-03-25 09:24:59.985	2026-03-25 09:24:59.985	f	\N	0	new	\N	\N	\N
244	СЧ-000244	2026-03-25 09:27:31.639	71	2026-03-25 09:27:31.641	2026-03-25 09:27:31.641	f	\N	0	new	\N	\N	\N
249	СЧ-000249	2026-03-25 09:39:51.148	43	2026-03-25 09:39:51.148	2026-03-25 09:39:51.148	f	\N	0	new	\N	\N	\N
250	СЧ-000250	2026-03-25 09:44:23.358	58	2026-03-25 09:44:23.359	2026-03-25 09:44:23.359	f	\N	0	new	\N	\N	\N
251	СЧ-000251	2026-03-25 09:45:45.606	53	2026-03-25 09:45:45.607	2026-03-25 09:45:45.607	f	\N	0	new	\N	\N	\N
252	СЧ-000252	2026-03-25 09:48:24.547	49	2026-03-25 09:48:24.548	2026-03-25 09:48:24.548	f	\N	0	new	\N	\N	\N
257	СЧ-000257	2026-03-25 10:13:21.506	54	2026-03-25 10:13:21.507	2026-03-25 10:13:21.507	f	\N	0	new	\N	\N	\N
260	СЧ-000260	2026-03-25 10:18:54.772	76	2026-03-25 10:18:54.773	2026-03-25 10:18:55.89	f	\N	0	awaiting_payment	INV-260-1774433935694	8209135424	https://pay.tbank.ru/tc6KNseJ
261	СЧ-000261	2026-03-25 10:19:15.039	76	2026-03-25 10:19:15.04	2026-03-25 10:19:15.986	f	\N	0	awaiting_payment	INV-261-1774433955725	8209137620	https://pay.tbank.ru/7mi7HoBf
262	СЧ-000262	2026-03-25 10:19:35.36	76	2026-03-25 10:19:35.361	2026-03-25 10:19:36.583	f	\N	0	awaiting_payment	INV-262-1774433976391	8209139929	https://pay.tbank.ru/vOXsqdhm
263	СЧ-000263	2026-03-25 10:20:10.459	76	2026-03-25 10:20:10.46	2026-03-25 10:20:11.571	f	\N	0	awaiting_payment	INV-263-1774434011308	8209143804	https://pay.tbank.ru/fi7ipcQK
264	СЧ-000264	2026-03-25 10:20:56.941	77	2026-03-25 10:20:56.942	2026-03-25 10:20:56.942	f	\N	0	new	\N	\N	\N
306	СЧ-000306	2026-03-26 13:36:09.633	45	2026-03-26 13:36:09.634	2026-03-26 13:36:09.634	f	\N	0	new	\N	\N	\N
442	СЧ-000442	2026-04-02 07:31:11.984	112	2026-04-02 07:31:11.985	2026-04-02 07:31:11.985	f	\N	0	new	\N	\N	\N
236	СЧ-000236	2026-03-25 09:21:18.37	68	2026-03-25 09:21:18.371	2026-04-11 20:12:15.465	t	2026-03-26 07:11:39.542	0	paid	INV-236-1774430479398	8208779096	https://pay.tbank.ru/GK3rxiqa
246	СЧ-000246	2026-03-25 09:28:56.278	66	2026-03-25 09:28:56.279	2026-04-11 16:36:33.427	t	2026-03-25 16:29:09.612	0	paid	INV-246-1774430936952	8208821613	https://pay.tbank.ru/ojVHim0V
213	СЧ-000213	2026-03-23 17:48:23.592	58	2026-03-23 17:48:23.593	2026-04-12 18:33:08.861	t	2026-03-23 18:31:38.302	0	paid	INV-213-1774288104758	8200001306	https://pay.tbank.ru/b36375Js
226	СЧ-000226	2026-03-24 07:57:18.04	40	2026-03-24 07:57:18.041	2026-04-11 19:12:51.547	t	2026-03-24 19:10:05.706	0	paid	INV-226-1774339039087	8202623706	https://pay.tbank.ru/Ziv6PqBa
353	СЧ-000353	2026-03-30 09:24:48.608	40	2026-03-30 09:24:48.609	2026-04-11 20:07:20.699	t	2026-03-30 20:06:15.087	0	paid	INV-353-1774862690302	8237998284	https://pay.tbank.ru/kZhdo7vZ
237	СЧ-000237	2026-03-25 09:21:45.297	68	2026-03-25 09:21:45.298	2026-04-11 20:12:34.757	t	2026-03-26 07:12:01.381	0	paid	INV-237-1774430507434	8208781773	https://pay.tbank.ru/jmKepxJ8
225	СЧ-000225	2026-03-24 04:22:58.431	39	2026-03-24 04:22:58.432	2026-04-12 04:26:59.705	t	2026-03-24 04:25:25.797	0	paid	INV-225-1774326179810	8201674288	https://pay.tbank.ru/astxPjny
205	СЧ-000205	2026-03-23 06:14:48.96	64	2026-03-23 06:14:48.961	2026-04-12 06:23:42.572	t	2026-03-23 06:22:23.571	0	paid	INV-205-1774246490095	8196384416	https://pay.tbank.ru/C2a9czv6
222	СЧ-000222	2026-03-24 04:12:21.139	51	2026-03-24 04:12:21.14	2026-04-12 06:30:32.1	t	2026-03-24 06:29:13.393	0	paid	INV-222-1774325542103	8201636327	https://pay.tbank.ru/t97V4b0s
221	СЧ-000221	2026-03-24 04:08:18.68	49	2026-03-24 04:08:18.681	2026-04-13 06:50:49.697	t	2026-03-24 06:49:24.605	0	paid	INV-221-1774325299680	8201622316	https://pay.tbank.ru/Cr7vLAnt
217	СЧ-000217	2026-03-23 18:24:35.013	32	2026-03-23 18:24:35.014	2026-04-13 07:05:42.591	t	2026-03-24 07:03:01.375	0	paid	INV-217-1774290290400	8200142532	https://pay.tbank.ru/NRaegCck
224	СЧ-000224	2026-03-24 04:18:43.973	40	2026-03-24 04:18:43.974	2026-04-13 07:08:53.296	t	2026-03-24 07:05:44.531	0	paid	INV-224-1774325925140	8201659484	https://pay.tbank.ru/sJF09zkD
227	СЧ-000227	2026-03-24 09:14:53.229	79	2026-03-24 09:14:53.23	2026-04-12 09:32:35.445	t	2026-03-24 09:31:22.274	0	paid	INV-227-1774343694398	8203056893	https://pay.tbank.ru/noCKsXLW
259	СЧ-000259	2026-03-25 10:15:16.585	75	2026-03-25 10:15:16.585	2026-04-13 10:24:08.208	t	2026-03-25 10:16:39.06	0	paid	INV-259-1774433717427	8209110412	https://pay.tbank.ru/2OLUXXqh
254	СЧ-000254	2026-03-25 10:11:35.317	75	2026-03-25 10:11:35.317	2026-04-13 10:20:42.994	t	2026-03-25 10:12:30.673	0	paid	INV-254-1774433496035	8209085267	https://pay.tbank.ru/G4jY5y77
256	СЧ-000256	2026-03-25 10:12:21.906	75	2026-03-25 10:12:21.907	2026-04-13 10:21:28.883	t	2026-03-25 10:13:46.713	0	paid	INV-256-1774433542633	8209090882	https://pay.tbank.ru/yMXjZfw5
258	СЧ-000258	2026-03-25 10:14:43.872	75	2026-03-25 10:14:43.873	2026-04-13 10:25:23.791	t	2026-03-25 10:18:25.344	0	paid	INV-258-1774433684799	8209106812	https://pay.tbank.ru/eFBE9sLx
182	СЧ-000182	2026-03-20 11:12:00.144	61	2026-03-20 11:12:00.145	2026-04-13 11:16:54.589	t	2026-03-20 11:15:35.555	0	paid	INV-182-1774005121802	8180885388	https://pay.tbank.ru/JGWR7Dam
242	СЧ-000242	2026-03-25 09:24:24.894	79	2026-03-25 09:24:24.894	2026-04-12 10:50:45.666	t	2026-03-25 10:43:48.157	0	paid	INV-242-1774430665541	8208796717	https://pay.tbank.ru/wKmD2JKV
303	СЧ-000303	2026-03-26 13:34:00.791	58	2026-03-26 13:34:00.792	2026-04-12 13:36:44.451	t	2026-03-26 13:35:36.332	0	paid	INV-303-1774532041746	8216672274	https://pay.tbank.ru/6WX9OeYH
323	СЧ-000323	2026-03-27 13:09:21.609	52	2026-03-27 13:09:21.61	2026-03-27 13:09:21.61	f	\N	0	new	\N	\N	\N
313	СЧ-000313	2026-03-26 13:56:41.127	29	2026-03-26 13:56:41.128	2026-03-26 13:56:41.128	f	\N	0	new	\N	\N	\N
315	СЧ-000315	2026-03-27 10:35:56.615	18	2026-03-27 10:35:56.616	2026-03-27 10:35:59.638	f	\N	0	awaiting_payment	INV-315-1774607759395	8221761636	https://pay.tbank.ru/2IbOCNne
326	СЧ-000326	2026-03-27 13:12:39.499	83	2026-03-27 13:12:39.5	2026-03-27 13:12:40.446	f	\N	0	awaiting_payment	INV-326-1774617160230	8222584125	https://pay.tbank.ru/mPe8cGuH
352	СЧ-000352	2026-03-30 09:24:12.433	58	2026-03-30 09:24:12.434	2026-03-30 09:24:13.595	f	\N	0	awaiting_payment	INV-352-1774862653410	8237993917	https://pay.tbank.ru/NhhpAEA3
317	СЧ-000317	2026-03-27 12:01:12.072	48	2026-03-27 12:01:12.074	2026-03-27 12:01:13.123	f	\N	0	awaiting_payment	INV-317-1774612872843	8222200465	https://pay.tbank.ru/sLHrkM3A
332	СЧ-000332	2026-03-27 13:24:49.114	51	2026-03-27 13:24:49.116	2026-03-27 13:24:50.179	f	\N	0	awaiting_payment	INV-332-1774617889917	8222644619	https://pay.tbank.ru/51q3kxVI
336	СЧ-000336	2026-03-27 13:27:25.514	38	2026-03-27 13:27:25.515	2026-03-27 13:27:25.515	f	\N	0	new	\N	\N	\N
347	СЧ-000347	2026-03-30 06:22:20.546	92	2026-03-30 06:22:20.547	2026-03-30 06:22:21.493	f	\N	0	awaiting_payment	INV-347-1774851741295	8236912668	https://pay.tbank.ru/Ua9081HL
319	СЧ-000319	2026-03-27 12:11:59.561	73	2026-03-27 12:11:59.562	2026-03-27 12:11:59.562	f	\N	0	new	\N	\N	\N
348	СЧ-000348	2026-03-30 06:23:26.485	71	2026-03-30 06:23:26.486	2026-03-30 06:23:26.486	f	\N	0	new	\N	\N	\N
354	СЧ-000354	2026-03-30 09:28:10.888	43	2026-03-30 09:28:10.889	2026-03-30 09:28:10.889	f	\N	0	new	\N	\N	\N
321	СЧ-000321	2026-03-27 12:20:30.616	46	2026-03-27 12:20:30.618	2026-03-27 12:20:35.064	f	\N	0	awaiting_payment	INV-321-1774614034856	8222304555	https://pay.tbank.ru/WFP7xGDh
355	СЧ-000355	2026-03-30 09:29:05.895	33	2026-03-30 09:29:05.896	2026-03-30 09:29:05.896	f	\N	0	new	\N	\N	\N
341	СЧ-000341	2026-03-27 14:04:36.594	35	2026-03-27 14:04:36.595	2026-03-27 14:04:36.595	f	\N	0	new	\N	\N	\N
361	СЧ-000361	2026-03-31 07:27:01.724	105	2026-03-31 07:27:01.725	2026-03-31 07:27:01.725	f	\N	0	new	\N	\N	\N
357	СЧ-000357	2026-03-30 09:30:59.782	45	2026-03-30 09:30:59.783	2026-03-30 09:30:59.783	f	\N	0	new	\N	\N	\N
342	СЧ-000342	2026-03-27 14:05:25.059	33	2026-03-27 14:05:25.06	2026-03-27 14:05:25.06	f	\N	0	new	\N	\N	\N
366	СЧ-000366	2026-03-31 07:45:10.918	29	2026-03-31 07:45:10.92	2026-03-31 07:45:10.92	f	\N	0	new	\N	\N	\N
343	СЧ-000343	2026-03-27 14:07:33.776	61	2026-03-27 14:07:33.777	2026-03-27 14:07:33.777	f	\N	0	new	\N	\N	\N
359	СЧ-000359	2026-03-30 09:36:26.013	50	2026-03-30 09:36:26.014	2026-03-30 09:36:26.014	f	\N	0	new	\N	\N	\N
362	СЧ-000362	2026-03-31 07:29:08.524	105	2026-03-31 07:29:08.525	2026-03-31 07:29:08.525	f	\N	0	new	\N	\N	\N
367	СЧ-000367	2026-03-31 07:46:38.134	71	2026-03-31 07:46:38.135	2026-03-31 07:46:38.135	f	\N	0	new	\N	\N	\N
363	СЧ-000363	2026-03-31 07:31:35.485	105	2026-03-31 07:31:35.486	2026-03-31 07:31:35.486	f	\N	0	new	\N	\N	\N
360	СЧ-000360	2026-03-30 10:03:13.447	45	2026-03-30 10:03:13.448	2026-03-30 10:03:13.448	f	\N	0	new	\N	\N	\N
364	СЧ-000364	2026-03-31 07:36:08.269	50	2026-03-31 07:36:08.27	2026-03-31 07:36:08.27	f	\N	0	new	\N	\N	\N
365	СЧ-000365	2026-03-31 07:36:46.756	50	2026-03-31 07:36:46.757	2026-03-31 07:36:46.757	f	\N	0	new	\N	\N	\N
368	СЧ-000368	2026-03-31 07:46:40.932	38	2026-03-31 07:46:40.933	2026-03-31 07:46:41.99	f	\N	0	awaiting_payment	INV-368-1774943201741	8243382176	https://pay.tbank.ru/mUUsfyAH
370	СЧ-000370	2026-03-31 07:48:05.134	33	2026-03-31 07:48:05.135	2026-03-31 07:48:05.135	f	\N	0	new	\N	\N	\N
372	СЧ-000372	2026-03-31 07:49:21.412	98	2026-03-31 07:49:21.413	2026-03-31 07:49:21.413	f	\N	0	new	\N	\N	\N
375	СЧ-000375	2026-03-31 08:02:27.255	53	2026-03-31 08:02:27.258	2026-03-31 08:02:27.258	f	\N	0	new	\N	\N	\N
267	СЧ-000267	2026-03-25 10:24:29.999	52	2026-03-25 10:24:30.001	2026-03-25 10:24:30.001	f	\N	0	new	\N	\N	\N
268	СЧ-000268	2026-03-25 10:25:27.981	52	2026-03-25 10:25:27.982	2026-03-25 10:25:27.982	f	\N	0	new	\N	\N	\N
269	СЧ-000269	2026-03-25 10:26:14.45	52	2026-03-25 10:26:14.451	2026-03-25 10:26:14.451	f	\N	0	new	\N	\N	\N
443	СЧ-000443	2026-04-02 07:31:50.946	94	2026-04-02 07:31:50.947	2026-04-02 07:31:50.947	f	\N	0	new	\N	\N	\N
299	СЧ-000299	2026-03-26 10:04:08.541	55	2026-03-26 10:04:08.542	2026-03-26 10:04:08.542	f	\N	0	new	\N	\N	\N
270	СЧ-000270	2026-03-25 10:29:07.75	42	2026-03-25 10:29:07.751	2026-03-25 10:29:07.751	f	\N	0	new	\N	\N	\N
324	СЧ-000324	2026-03-27 13:10:34.35	56	2026-03-27 13:10:34.351	2026-03-27 13:10:34.351	f	\N	0	new	\N	\N	\N
295	СЧ-000295	2026-03-26 09:43:03.951	86	2026-03-26 09:43:03.952	2026-04-12 17:05:46.873	t	2026-03-26 17:04:42.365	0	paid	INV-295-1774518184796	8215395406	https://pay.tbank.ru/DghHCMfF
296	СЧ-000296	2026-03-26 09:43:39.045	86	2026-03-26 09:43:39.046	2026-04-12 17:06:14.576	t	2026-03-26 17:05:16.664	0	paid	INV-296-1774518219768	8215398693	https://pay.tbank.ru/KNdxLG0w
285	СЧ-000285	2026-03-25 14:39:22.415	61	2026-03-25 14:39:22.416	2026-04-12 17:42:48.527	t	2026-03-25 17:35:16.529	0	paid	INV-285-1774449563258	8210719860	https://pay.tbank.ru/txeptIvp
275	СЧ-000275	2026-03-25 10:32:11.518	36	2026-03-25 10:32:11.519	2026-04-12 04:06:39.531	t	2026-03-26 07:05:47.676	0	paid	INV-275-1774434732442	8209223081	https://pay.tbank.ru/k7j9DK9i
358	СЧ-000358	2026-03-30 09:34:11.35	32	2026-03-30 09:34:11.352	2026-04-12 06:08:26.402	t	2026-03-31 06:07:23.452	0	paid	INV-358-1774863256754	8238051227	https://pay.tbank.ru/cYopzR7L
371	СЧ-000371	2026-03-31 07:48:44.894	61	2026-03-31 07:48:44.895	2026-04-13 07:51:30.623	t	2026-03-31 07:49:44.888	0	paid	INV-371-1774943341475	8243395397	https://pay.tbank.ru/umeB4Qch
374	СЧ-000374	2026-03-31 08:01:26.743	40	2026-03-31 08:01:26.744	2026-04-13 08:15:43.286	t	2026-03-31 08:13:55.937	0	paid	INV-374-1774944087722	8243465760	https://pay.tbank.ru/6xinBP1k
180	СЧ-000180	2026-03-20 09:18:40.037	51	2026-03-20 09:18:40.038	2026-04-12 09:21:48.733	t	2026-03-20 09:20:15.002	0	paid	INV-180-1773998321586	8180191329	https://pay.tbank.ru/aJzh4JlW
293	СЧ-000293	2026-03-26 09:41:47.834	27	2026-03-26 09:41:47.835	2026-04-12 09:56:21.873	t	2026-03-26 09:55:21.335	0	paid	INV-293-1774518108838	8215388240	https://pay.tbank.ru/cT9kXCPR
356	СЧ-000356	2026-03-30 09:30:00.324	61	2026-03-30 09:30:00.325	2026-04-12 10:02:07.24	t	2026-03-30 10:00:59.918	0	paid	INV-356-1774863002065	8238025625	https://pay.tbank.ru/jTCpacNe
253	СЧ-000253	2026-03-25 10:10:54.507	75	2026-03-25 10:10:54.507	2026-04-13 10:20:35.518	t	2026-03-25 10:12:04.222	0	paid	INV-253-1774433455189	8209080388	https://pay.tbank.ru/233gB3uD
241	СЧ-000241	2026-03-25 09:24:05.27	79	2026-03-25 09:24:05.271	2026-04-12 10:50:19.376	t	2026-03-25 10:43:22.119	0	paid	INV-241-1774430646120	8208794898	https://pay.tbank.ru/cTqnXFFZ
173	СЧ-000173	2026-03-19 13:45:34.781	38	2026-03-19 13:45:34.782	2026-04-13 11:14:45.039	t	2026-03-20 11:13:33.482	0	paid	INV-173-1773927935741	8175681522	https://pay.tbank.ru/YxIYOLJx
369	СЧ-000369	2026-03-31 07:47:27.578	32	2026-03-31 07:47:27.579	2026-04-13 11:29:41.047	t	2026-03-31 11:28:36.198	0	paid	INV-369-1774943248392	8243386736	https://pay.tbank.ru/07spZvYK
325	СЧ-000325	2026-03-27 13:11:30.749	91	2026-03-27 13:11:30.75	2026-04-12 13:13:47.372	t	2026-03-27 13:12:49.596	0	paid	INV-325-1774617091600	8222578294	https://pay.tbank.ru/uTjFROHB
331	СЧ-000331	2026-03-27 13:24:22.273	58	2026-03-27 13:24:22.274	2026-04-12 13:30:46.017	t	2026-03-27 13:29:35.97	0	paid	INV-331-1774617863241	8222642448	https://pay.tbank.ru/wOhFDJU4
333	СЧ-000333	2026-03-27 13:25:23.793	40	2026-03-27 13:25:23.794	2026-04-12 13:31:47.692	t	2026-03-27 13:30:46.582	0	paid	INV-333-1774617924562	8222647398	https://pay.tbank.ru/fbLDqAC9
338	СЧ-000338	2026-03-27 13:41:52.259	79	2026-03-27 13:41:52.26	2026-04-12 13:46:34.62	t	2026-03-27 13:45:29.318	0	paid	INV-338-1774618913194	8222731027	https://pay.tbank.ru/cliht8Y4
316	СЧ-000316	2026-03-27 11:54:41.469	48	2026-03-27 11:54:41.47	2026-03-27 11:54:43.856	f	\N	0	awaiting_payment	INV-316-1774612483428	8222167966	https://pay.tbank.ru/Q7AQLdSv
277	СЧ-000277	2026-03-25 10:40:37.19	45	2026-03-25 10:40:37.191	2026-03-25 10:40:37.191	f	\N	0	new	\N	\N	\N
300	СЧ-000300	2026-03-26 10:22:10.949	65	2026-03-26 10:22:10.95	2026-03-26 10:22:10.95	f	\N	0	new	\N	\N	\N
444	СЧ-000444	2026-04-02 07:32:17.543	94	2026-04-02 07:32:17.544	2026-04-02 07:32:17.544	f	\N	0	new	\N	\N	\N
279	СЧ-000279	2026-03-25 10:57:24.932	84	2026-03-25 10:57:24.933	2026-03-25 10:57:29.687	f	\N	0	awaiting_payment	INV-279-1774436249445	8209384905	https://pay.tbank.ru/6bwC37A5
280	СЧ-000280	2026-03-25 10:57:41.946	84	2026-03-25 10:57:41.947	2026-03-25 10:57:43.757	f	\N	0	awaiting_payment	INV-280-1774436263507	8209386363	https://pay.tbank.ru/BymCIO1g
281	СЧ-000281	2026-03-25 14:36:46.422	79	2026-03-25 14:36:46.423	2026-03-25 14:36:48.122	f	\N	0	awaiting_payment	INV-281-1774449407860	8210705401	https://pay.tbank.ru/cLTHdaCU
302	СЧ-000302	2026-03-26 13:33:14.685	33	2026-03-26 13:33:14.686	2026-03-26 13:33:14.686	f	\N	0	new	\N	\N	\N
283	СЧ-000283	2026-03-25 14:37:28.118	33	2026-03-25 14:37:28.119	2026-03-25 14:37:28.119	f	\N	0	new	\N	\N	\N
327	СЧ-000327	2026-03-27 13:13:57.122	46	2026-03-27 13:13:57.123	2026-03-27 13:13:58.322	f	\N	0	awaiting_payment	INV-327-1774617237955	8222590895	https://pay.tbank.ru/OBSbO3dq
287	СЧ-000287	2026-03-25 14:40:21.05	29	2026-03-25 14:40:21.051	2026-03-25 14:40:21.051	f	\N	0	new	\N	\N	\N
318	СЧ-000318	2026-03-27 12:04:36.563	18	2026-03-27 12:04:36.564	2026-03-27 12:04:37.714	f	\N	0	awaiting_payment	INV-318-1774613077355	8222220283	https://pay.tbank.ru/rn4TkAPQ
312	СЧ-000312	2026-03-26 13:55:53.97	43	2026-03-26 13:55:53.971	2026-03-26 13:55:53.971	f	\N	0	new	\N	\N	\N
305	СЧ-000305	2026-03-26 13:35:32.484	53	2026-03-26 13:35:32.485	2026-03-26 13:35:32.485	f	\N	0	new	\N	\N	\N
289	СЧ-000289	2026-03-25 14:41:13.831	50	2026-03-25 14:41:13.832	2026-03-25 14:41:13.832	f	\N	0	new	\N	\N	\N
290	СЧ-000290	2026-03-25 17:24:46.993	48	2026-03-25 17:24:46.994	2026-03-25 17:24:46.994	f	\N	0	new	\N	\N	\N
328	СЧ-000328	2026-03-27 13:18:49.987	62	2026-03-27 13:18:49.988	2026-03-27 13:18:49.988	f	\N	0	new	\N	\N	\N
322	СЧ-000322	2026-03-27 13:07:39.397	57	2026-03-27 13:07:39.398	2026-03-27 13:07:39.398	f	\N	0	new	\N	\N	\N
320	СЧ-000320	2026-03-27 12:16:19.848	56	2026-03-27 12:16:19.849	2026-03-27 12:16:19.849	f	\N	0	new	\N	\N	\N
329	СЧ-000329	2026-03-27 13:19:41.454	70	2026-03-27 13:19:41.455	2026-03-27 13:19:41.455	f	\N	0	new	\N	\N	\N
330	СЧ-000330	2026-03-27 13:19:58.389	70	2026-03-27 13:19:58.39	2026-03-27 13:19:58.39	f	\N	0	new	\N	\N	\N
335	СЧ-000335	2026-03-27 13:25:53.186	50	2026-03-27 13:25:53.187	2026-03-27 13:25:53.187	f	\N	0	new	\N	\N	\N
334	СЧ-000334	2026-03-27 13:25:44.165	89	2026-03-27 13:25:44.166	2026-03-27 13:25:44.166	f	\N	0	new	\N	\N	\N
337	СЧ-000337	2026-03-27 13:34:50.295	69	2026-03-27 13:34:50.296	2026-03-27 13:34:50.296	f	\N	0	new	\N	\N	\N
339	СЧ-000339	2026-03-27 14:02:46.748	49	2026-03-27 14:02:46.749	2026-03-27 14:02:47.769	f	\N	0	awaiting_payment	INV-339-1774620167564	8222832186	https://pay.tbank.ru/aMCIWvzE
340	СЧ-000340	2026-03-27 14:03:57.396	53	2026-03-27 14:03:57.397	2026-03-27 14:03:57.397	f	\N	0	new	\N	\N	\N
344	СЧ-000344	2026-03-27 14:08:35.17	43	2026-03-27 14:08:35.171	2026-03-27 14:08:35.171	f	\N	0	new	\N	\N	\N
349	СЧ-000349	2026-03-30 06:37:21.898	44	2026-03-30 06:37:21.899	2026-03-30 06:37:21.899	f	\N	0	new	\N	\N	\N
350	СЧ-000350	2026-03-30 09:19:29.009	29	2026-03-30 09:19:29.011	2026-03-30 09:19:29.011	f	\N	0	new	\N	\N	\N
376	СЧ-000376	2026-03-31 08:04:30.229	50	2026-03-31 08:04:30.231	2026-03-31 08:04:30.231	f	\N	0	new	\N	\N	\N
377	СЧ-000377	2026-03-31 08:05:33.111	43	2026-03-31 08:05:33.112	2026-03-31 08:05:33.112	f	\N	0	new	\N	\N	\N
445	СЧ-000445	2026-04-02 07:33:29.115	94	2026-04-02 07:33:29.116	2026-04-02 07:33:29.116	f	\N	0	new	\N	\N	\N
378	СЧ-000378	2026-03-31 08:07:19.743	59	2026-03-31 08:07:19.744	2026-03-31 08:07:20.602	f	\N	0	awaiting_payment	INV-378-1774944440391	8243502726	https://pay.tbank.ru/CqYwO4gl
379	СЧ-000379	2026-03-31 08:07:47.859	45	2026-03-31 08:07:47.86	2026-03-31 08:07:47.86	f	\N	0	new	\N	\N	\N
380	СЧ-000380	2026-03-31 08:07:59.541	97	2026-03-31 08:07:59.543	2026-03-31 08:07:59.543	f	\N	0	new	\N	\N	\N
381	СЧ-000381	2026-03-31 08:09:46.192	97	2026-03-31 08:09:46.193	2026-03-31 08:09:46.193	f	\N	0	new	\N	\N	\N
382	СЧ-000382	2026-03-31 08:15:55.565	103	2026-03-31 08:15:55.567	2026-03-31 08:15:55.567	f	\N	0	new	\N	\N	\N
383	СЧ-000383	2026-03-31 08:19:01.362	43	2026-03-31 08:19:01.364	2026-03-31 08:19:01.364	f	\N	0	new	\N	\N	\N
397	СЧ-000397	2026-04-01 08:47:50.742	77	2026-04-01 08:47:50.743	2026-04-01 08:47:50.743	f	\N	0	new	\N	\N	\N
310	СЧ-000310	2026-03-26 13:43:24.744	32	2026-03-26 13:43:24.745	2026-04-12 15:37:12.422	t	2026-03-26 15:36:12.518	0	paid	INV-310-1774532605395	8216722497	https://pay.tbank.ru/KGNPNkoj
314	СЧ-000314	2026-03-26 18:01:51.844	61	2026-03-26 18:01:51.845	2026-04-11 18:03:12.579	t	2026-03-26 18:02:16.446	0	paid	INV-314-1774548113563	8218041756	https://pay.tbank.ru/n9nefba1
274	СЧ-000274	2026-03-25 10:31:58.316	36	2026-03-25 10:31:58.317	2026-04-12 04:06:02.423	t	2026-03-26 07:05:01.229	0	paid	INV-274-1774434719049	8209221546	https://pay.tbank.ru/wdM2fL64
307	СЧ-000307	2026-03-26 13:40:32.718	51	2026-03-26 13:40:32.719	2026-04-12 05:40:07.697	t	2026-03-27 05:38:55.583	0	paid	INV-307-1774532434715	8216707054	https://pay.tbank.ru/XXbkhWgj
276	СЧ-000276	2026-03-25 10:34:32.846	38	2026-03-25 10:34:32.847	2026-04-12 06:23:21.775	t	2026-03-26 06:22:14.209	0	paid	INV-276-1774434874819	8209239990	https://pay.tbank.ru/sVCpLiZ7
273	СЧ-000273	2026-03-25 10:31:27.72	82	2026-03-25 10:31:27.721	2026-04-12 10:40:19.621	t	2026-03-25 10:33:18.872	0	paid	INV-273-1774434688450	8209218146	https://pay.tbank.ru/il0Ka6ml
240	СЧ-000240	2026-03-25 09:23:30.33	79	2026-03-25 09:23:30.33	2026-04-12 10:50:19.384	t	2026-03-25 10:42:52.978	0	paid	INV-240-1774430611058	8208791703	https://pay.tbank.ru/hWYO5CqT
278	СЧ-000278	2026-03-25 10:49:05.709	46	2026-03-25 10:49:05.71	2026-04-13 11:01:43.557	t	2026-03-25 10:54:43.3	0	paid	INV-278-1774435746702	8209332413	https://pay.tbank.ru/XsJMCRS0
351	СЧ-000351	2026-03-30 09:23:14.21	79	2026-03-30 09:23:14.211	2026-04-13 11:45:15.325	t	2026-03-30 11:44:13.066	0	paid	INV-351-1774862603667	8237989491	https://pay.tbank.ru/W4Zb1k5h
403	СЧ-000403	2026-04-01 08:53:21.307	64	2026-04-01 08:53:21.309	2026-04-12 12:17:36.719	t	2026-04-01 12:16:38.702	0	paid	INV-403-1775033602990	8249797062	https://pay.tbank.ru/Shs9S2uX
304	СЧ-000304	2026-03-26 13:34:44.235	40	2026-03-26 13:34:44.236	2026-04-12 12:51:47.09	t	2026-03-27 12:50:51.049	0	paid	INV-304-1774532085158	8216676021	https://pay.tbank.ru/VKXpqzPH
422	СЧ-000422	2026-04-01 12:37:39.794	64	2026-04-01 12:37:39.794	2026-04-12 12:58:08.932	t	2026-04-01 12:56:58.419	0	paid	INV-422-1775047060809	8251044850	https://pay.tbank.ru/WlLVt2fi
153	СЧ-000153	2026-03-18 13:31:21.273	31	2026-03-18 13:31:21.275	2026-04-12 13:54:23.797	t	2026-03-18 13:53:07.541	0	paid	INV-153-1773840682916	8169805310	https://pay.tbank.ru/SS3OoRVb
271	СЧ-000271	2026-03-25 10:29:50.083	83	2026-03-25 10:29:50.084	2026-04-12 13:55:49.94	t	2026-03-25 13:48:50.486	0	paid	INV-271-1774434590735	8209206715	https://pay.tbank.ru/LG12ZoTL
288	СЧ-000288	2026-03-25 14:40:52.564	58	2026-03-25 14:40:52.565	2026-04-12 14:58:28.467	t	2026-03-25 14:51:29.137	0	paid	INV-288-1774449653615	8210728861	https://pay.tbank.ru/odBxrEGJ
266	СЧ-000266	2026-03-25 10:22:26.557	64	2026-03-25 10:22:26.558	2026-04-12 15:04:11.988	t	2026-03-25 14:57:10.177	0	paid	INV-266-1774434148060	8209159084	https://pay.tbank.ru/vTzXcYGm
399	СЧ-000399	2026-04-01 08:48:46.552	95	2026-04-01 08:48:46.553	2026-04-01 08:48:46.553	f	\N	0	new	\N	\N	\N
400	СЧ-000400	2026-04-01 08:49:34.043	34	2026-04-01 08:49:34.044	2026-04-01 08:49:34.044	f	\N	0	new	\N	\N	\N
384	СЧ-000384	2026-03-31 09:20:04.247	41	2026-03-31 09:20:04.249	2026-03-31 09:20:05.939	f	\N	0	awaiting_payment	INV-384-1774948805710	8243922051	https://pay.tbank.ru/k7u3uB4O
385	СЧ-000385	2026-03-31 09:45:19.701	48	2026-03-31 09:45:19.702	2026-03-31 09:45:34.142	f	\N	0	awaiting_payment	INV-385-1774950333888	8244068451	https://pay.tbank.ru/PkQTR1tZ
401	СЧ-000401	2026-04-01 08:49:58.607	75	2026-04-01 08:49:58.608	2026-04-01 08:49:59.66	f	\N	0	awaiting_payment	INV-401-1775033399357	8249777007	https://pay.tbank.ru/YexCD4Vl
402	СЧ-000402	2026-04-01 08:50:26.191	67	2026-04-01 08:50:26.192	2026-04-01 08:50:26.192	f	\N	0	new	\N	\N	\N
386	СЧ-000386	2026-03-31 10:37:35.787	36	2026-03-31 10:37:35.788	2026-03-31 10:37:39.803	f	\N	0	awaiting_payment	INV-386-1774953459558	8244376091	https://pay.tbank.ru/trLloZcX
387	СЧ-000387	2026-03-31 10:38:03.703	36	2026-03-31 10:38:03.704	2026-03-31 10:38:05.515	f	\N	0	awaiting_payment	INV-387-1774953485303	8244378566	https://pay.tbank.ru/cClXrr5Y
388	СЧ-000388	2026-03-31 10:55:12.653	56	2026-03-31 10:55:12.654	2026-03-31 10:55:12.654	f	\N	0	new	\N	\N	\N
449	СЧ-000449	2026-04-02 09:38:02.168	29	2026-04-02 09:38:02.169	2026-04-02 09:38:02.169	f	\N	0	new	\N	\N	\N
408	СЧ-000408	2026-04-01 10:10:16.719	34	2026-04-01 10:10:16.72	2026-04-01 10:10:16.72	f	\N	0	new	\N	\N	\N
404	СЧ-000404	2026-04-01 09:00:20.998	95	2026-04-01 09:00:20.999	2026-04-01 09:00:20.999	f	\N	0	new	\N	\N	\N
450	СЧ-000450	2026-04-02 09:38:32.601	33	2026-04-02 09:38:32.602	2026-04-02 09:38:32.602	f	\N	0	new	\N	\N	\N
405	СЧ-000405	2026-04-01 09:00:56.536	75	2026-04-01 09:00:56.537	2026-04-01 09:01:04.671	f	\N	0	awaiting_payment	INV-405-1775034062891	8249842143	https://pay.tbank.ru/pPaXTyYN
406	СЧ-000406	2026-04-01 09:01:35.498	42	2026-04-01 09:01:35.499	2026-04-01 09:01:35.499	f	\N	0	new	\N	\N	\N
407	СЧ-000407	2026-04-01 09:02:02.45	69	2026-04-01 09:02:02.452	2026-04-01 09:02:02.452	f	\N	0	new	\N	\N	\N
415	СЧ-000415	2026-04-01 12:21:06.902	34	2026-04-01 12:21:06.904	2026-04-01 12:21:06.904	f	\N	0	new	\N	\N	\N
416	СЧ-000416	2026-04-01 12:21:37.128	75	2026-04-01 12:21:37.129	2026-04-01 12:21:37.129	f	\N	0	new	\N	\N	\N
451	СЧ-000451	2026-04-02 09:38:48.023	33	2026-04-02 09:38:48.024	2026-04-02 09:38:48.024	f	\N	0	new	\N	\N	\N
409	СЧ-000409	2026-04-01 10:11:37.663	75	2026-04-01 10:11:37.668	2026-04-01 10:11:39.094	f	\N	0	awaiting_payment	INV-409-1775038298825	8250267995	https://pay.tbank.ru/TnbMmQR4
410	СЧ-000410	2026-04-01 10:12:18.587	102	2026-04-01 10:12:18.589	2026-04-01 10:12:18.589	f	\N	0	new	\N	\N	\N
389	СЧ-000389	2026-04-01 08:27:24.109	38	2026-04-01 08:27:24.111	2026-04-01 08:27:24.111	f	\N	0	new	\N	\N	\N
390	СЧ-000390	2026-04-01 08:28:34.158	73	2026-04-01 08:28:34.159	2026-04-01 08:28:34.159	f	\N	0	new	\N	\N	\N
391	СЧ-000391	2026-04-01 08:30:09.201	49	2026-04-01 08:30:09.202	2026-04-01 08:30:09.202	f	\N	0	new	\N	\N	\N
393	СЧ-000393	2026-04-01 08:33:47.992	67	2026-04-01 08:33:47.994	2026-04-01 08:33:47.994	f	\N	0	new	\N	\N	\N
394	СЧ-000394	2026-04-01 08:34:15.797	89	2026-04-01 08:34:15.798	2026-04-01 08:34:15.798	f	\N	0	new	\N	\N	\N
395	СЧ-000395	2026-04-01 08:35:07.504	102	2026-04-01 08:35:07.506	2026-04-01 08:35:07.506	f	\N	0	new	\N	\N	\N
411	СЧ-000411	2026-04-01 10:54:03.155	104	2026-04-01 10:54:03.156	2026-04-01 10:54:03.156	f	\N	0	new	\N	\N	\N
412	СЧ-000412	2026-04-01 10:54:22.764	104	2026-04-01 10:54:22.765	2026-04-01 10:54:22.765	f	\N	0	new	\N	\N	\N
418	СЧ-000418	2026-04-01 12:22:40.466	68	2026-04-01 12:22:40.468	2026-04-01 12:22:41.434	f	\N	0	awaiting_payment	INV-418-1775046161171	8250968417	https://pay.tbank.ru/3eGkGjEM
419	СЧ-000419	2026-04-01 12:23:36.222	42	2026-04-01 12:23:36.223	2026-04-01 12:23:36.223	f	\N	0	new	\N	\N	\N
423	СЧ-000423	2026-04-01 12:38:53.641	55	2026-04-01 12:38:53.642	2026-04-01 12:38:53.642	f	\N	0	new	\N	\N	\N
426	СЧ-000426	2026-04-01 12:59:31.74	34	2026-04-01 12:59:31.742	2026-04-01 12:59:31.742	f	\N	0	new	\N	\N	\N
413	СЧ-000413	2026-04-01 11:38:50.791	35	2026-04-01 11:38:50.792	2026-04-01 11:38:50.792	f	\N	0	new	\N	\N	\N
414	СЧ-000414	2026-04-01 11:39:26.681	35	2026-04-01 11:39:26.682	2026-04-01 11:39:26.682	f	\N	0	new	\N	\N	\N
420	СЧ-000420	2026-04-01 12:36:42.004	27	2026-04-01 12:36:42.005	2026-04-01 12:36:43.398	f	\N	0	awaiting_payment	INV-420-1775047003123	8251040276	https://pay.tbank.ru/A6q4DodZ
424	СЧ-000424	2026-04-01 12:39:26.702	68	2026-04-01 12:39:26.703	2026-04-01 12:39:27.695	f	\N	0	awaiting_payment	INV-424-1775047167423	8251053393	https://pay.tbank.ru/PDo9hSOj
427	СЧ-000427	2026-04-01 13:01:15.334	75	2026-04-01 13:01:15.335	2026-04-01 13:01:20.639	f	\N	0	awaiting_payment	INV-427-1775048479765	8251160452	https://pay.tbank.ru/ySAifsjy
429	СЧ-000429	2026-04-01 13:02:16.477	102	2026-04-01 13:02:16.478	2026-04-01 13:02:16.478	f	\N	0	new	\N	\N	\N
430	СЧ-000430	2026-04-01 13:03:28.785	96	2026-04-01 13:03:28.786	2026-04-01 13:03:28.786	f	\N	0	new	\N	\N	\N
432	СЧ-000432	2026-04-01 13:05:01.324	89	2026-04-01 13:05:01.325	2026-04-01 13:05:01.325	f	\N	0	new	\N	\N	\N
433	СЧ-000433	2026-04-01 13:07:13.429	106	2026-04-01 13:07:13.43	2026-04-01 13:07:13.43	f	\N	0	new	\N	\N	\N
434	СЧ-000434	2026-04-01 13:08:09.267	95	2026-04-01 13:08:09.268	2026-04-01 13:08:09.268	f	\N	0	new	\N	\N	\N
446	СЧ-000446	2026-04-02 07:33:54.473	94	2026-04-02 07:33:54.474	2026-04-02 07:33:54.474	f	\N	0	new	\N	\N	\N
452	СЧ-000452	2026-04-02 09:40:33.511	29	2026-04-02 09:40:33.512	2026-04-02 09:40:33.512	f	\N	0	new	\N	\N	\N
438	СЧ-000438	2026-04-01 13:11:03.356	75	2026-04-01 13:11:03.357	2026-04-01 13:11:04.374	f	\N	0	awaiting_payment	INV-438-1775049064134	8251212182	https://pay.tbank.ru/yeDY5lWp
453	СЧ-000453	2026-04-02 09:42:13.633	43	2026-04-02 09:42:13.634	2026-04-02 09:42:13.634	f	\N	0	new	\N	\N	\N
482	СЧ-000482	2026-04-03 12:05:58.016	52	2026-04-03 12:05:58.017	2026-04-03 12:05:58.017	f	\N	0	new	\N	\N	\N
483	СЧ-000483	2026-04-03 12:06:47.898	52	2026-04-03 12:06:47.899	2026-04-03 12:06:47.899	f	\N	0	new	\N	\N	\N
462	СЧ-000462	2026-04-02 09:53:00.271	58	2026-04-02 09:53:00.272	2026-04-02 09:53:01.536	f	\N	0	awaiting_payment	INV-462-1775123581282	8255836564	https://pay.tbank.ru/HhPUyNiC
471	СЧ-000471	2026-04-02 13:25:18.897	115	2026-04-02 13:25:18.898	2026-04-02 13:25:18.898	f	\N	0	new	\N	\N	\N
463	СЧ-000463	2026-04-02 09:54:47.506	35	2026-04-02 09:54:47.507	2026-04-02 09:54:47.507	f	\N	0	new	\N	\N	\N
474	СЧ-000474	2026-04-02 16:13:19.313	40	2026-04-02 16:13:19.314	2026-04-12 17:00:14.025	t	2026-04-02 16:59:22.326	0	paid	INV-474-1775146401974	8257624214	https://pay.tbank.ru/zJGsbgmg
398	СЧ-000398	2026-04-01 08:48:17.008	66	2026-04-01 08:48:17.009	2026-04-13 07:01:09.022	t	2026-04-02 07:00:05.388	0	paid	INV-398-1775033300868	8249767439	https://pay.tbank.ru/KUKmlgQN
392	СЧ-000392	2026-04-01 08:33:28.055	91	2026-04-01 08:33:28.056	2026-04-12 09:11:26.058	t	2026-04-01 09:10:25.258	0	paid	INV-392-1775032411960	8249676326	https://pay.tbank.ru/uOKbkgFS
448	СЧ-000448	2026-04-02 07:34:40.424	46	2026-04-02 07:34:40.425	2026-04-13 10:29:30.544	t	2026-04-02 10:28:33.599	0	paid	INV-448-1775115282431	8255098284	https://pay.tbank.ru/6OxpkEBJ
458	СЧ-000458	2026-04-02 09:51:31.453	39	2026-04-02 09:51:31.454	2026-04-13 10:31:05.743	t	2026-04-02 10:30:11.694	0	paid	INV-458-1775123492165	8255828617	https://pay.tbank.ru/CcP3azbM
428	СЧ-000428	2026-04-01 13:01:56.103	99	2026-04-01 13:01:56.104	2026-04-13 11:42:30.171	t	2026-04-02 11:41:39.196	0	paid	INV-428-1775048516804	8251163903	https://pay.tbank.ru/85SWoAji
417	СЧ-000417	2026-04-01 12:22:17.673	79	2026-04-01 12:22:17.674	2026-04-12 12:46:23.276	t	2026-04-01 12:45:29.207	0	paid	INV-417-1775047386208	8251071053	https://pay.tbank.ru/yBgs0bQ2
425	СЧ-000425	2026-04-01 12:53:22.252	64	2026-04-01 12:53:22.253	2026-04-12 12:58:55.326	t	2026-04-01 12:57:56.805	0	paid	INV-425-1775048002950	8251121683	https://pay.tbank.ru/EDvi4qxb
480	СЧ-000480	2026-04-03 12:00:30.039	52	2026-04-03 12:00:30.04	2026-04-03 12:00:30.04	f	\N	0	new	\N	\N	\N
464	СЧ-000464	2026-04-02 09:55:51.846	45	2026-04-02 09:55:51.847	2026-04-02 09:55:51.847	f	\N	0	new	\N	\N	\N
465	СЧ-000465	2026-04-02 09:56:47.906	50	2026-04-02 09:56:47.907	2026-04-02 09:56:47.907	f	\N	0	new	\N	\N	\N
472	СЧ-000472	2026-04-02 16:09:16.259	33	2026-04-02 16:09:16.26	2026-04-02 16:09:16.26	f	\N	0	new	\N	\N	\N
466	СЧ-000466	2026-04-02 10:01:17.108	50	2026-04-02 10:01:17.109	2026-04-02 10:01:17.109	f	\N	0	new	\N	\N	\N
469	СЧ-000469	2026-04-02 11:09:46.767	54	2026-04-02 11:09:46.768	2026-04-02 11:09:46.768	f	\N	0	new	\N	\N	\N
467	СЧ-000467	2026-04-02 10:03:26.369	53	2026-04-02 10:03:26.37	2026-04-02 10:03:26.37	f	\N	0	new	\N	\N	\N
468	СЧ-000468	2026-04-02 10:41:35.962	117	2026-04-02 10:41:35.963	2026-04-02 10:41:35.963	f	\N	0	new	\N	\N	\N
470	СЧ-000470	2026-04-02 11:11:20.523	81	2026-04-02 11:11:20.524	2026-04-02 11:11:20.524	f	\N	0	new	\N	\N	\N
477	СЧ-000477	2026-04-02 16:27:35.032	45	2026-04-02 16:27:35.033	2026-04-02 16:27:35.033	f	\N	0	new	\N	\N	\N
479	СЧ-000479	2026-04-03 08:42:02.811	70	2026-04-03 08:42:02.812	2026-04-03 08:42:02.812	f	\N	0	new	\N	\N	\N
484	СЧ-000484	2026-04-03 12:09:51.899	104	2026-04-03 12:09:51.9	2026-04-03 12:09:51.9	f	\N	0	new	\N	\N	\N
478	СЧ-000478	2026-04-02 16:30:42.734	32	2026-04-02 16:30:42.735	2026-04-02 16:30:42.735	f	\N	0	new	\N	\N	\N
485	СЧ-000485	2026-04-03 12:11:26.791	107	2026-04-03 12:11:26.792	2026-04-03 12:11:29.155	f	\N	0	awaiting_payment	INV-485-1775218288924	8263017924	https://pay.tbank.ru/ysZi452W
486	СЧ-000486	2026-04-03 12:12:26.788	67	2026-04-03 12:12:26.789	2026-04-03 12:12:26.789	f	\N	0	new	\N	\N	\N
487	СЧ-000487	2026-04-03 12:13:08.428	73	2026-04-03 12:13:08.429	2026-04-03 12:13:08.429	f	\N	0	new	\N	\N	\N
488	СЧ-000488	2026-04-03 12:15:15.711	113	2026-04-03 12:15:15.712	2026-04-03 12:15:15.712	f	\N	0	new	\N	\N	\N
489	СЧ-000489	2026-04-03 12:15:49.901	42	2026-04-03 12:15:49.902	2026-04-03 12:15:49.902	f	\N	0	new	\N	\N	\N
490	СЧ-000490	2026-04-03 12:16:49.62	70	2026-04-03 12:16:49.621	2026-04-03 12:16:49.621	f	\N	0	new	\N	\N	\N
491	СЧ-000491	2026-04-03 12:17:48.76	38	2026-04-03 12:17:48.761	2026-04-03 12:17:48.761	f	\N	0	new	\N	\N	\N
492	СЧ-000492	2026-04-03 12:18:26.994	107	2026-04-03 12:18:26.995	2026-04-03 12:18:38.627	f	\N	0	awaiting_payment	INV-492-1775218718369	8263066809	https://pay.tbank.ru/7ignSGHc
493	СЧ-000493	2026-04-03 12:19:04.639	49	2026-04-03 12:19:04.641	2026-04-03 12:19:04.641	f	\N	0	new	\N	\N	\N
494	СЧ-000494	2026-04-03 12:21:50.956	92	2026-04-03 12:21:50.957	2026-04-03 12:21:52.066	f	\N	0	awaiting_payment	INV-494-1775218911881	8263088094	https://pay.tbank.ru/mhpqcVNB
495	СЧ-000495	2026-04-03 12:22:19.333	88	2026-04-03 12:22:19.334	2026-04-03 12:22:19.334	f	\N	0	new	\N	\N	\N
496	СЧ-000496	2026-04-03 12:23:59.547	88	2026-04-03 12:23:59.548	2026-04-03 12:23:59.548	f	\N	0	new	\N	\N	\N
497	СЧ-000497	2026-04-03 12:25:24.927	105	2026-04-03 12:25:24.929	2026-04-03 12:25:24.929	f	\N	0	new	\N	\N	\N
498	СЧ-000498	2026-04-03 12:25:59.049	42	2026-04-03 12:25:59.05	2026-04-03 12:25:59.05	f	\N	0	new	\N	\N	\N
500	СЧ-000500	2026-04-03 12:28:41.547	49	2026-04-03 12:28:41.548	2026-04-03 12:28:41.548	f	\N	0	new	\N	\N	\N
538	СЧ-000538	2026-04-06 09:32:13.439	117	2026-04-06 09:32:13.44	2026-04-06 09:32:13.44	f	\N	0	new	\N	\N	\N
501	СЧ-000501	2026-04-03 12:41:35.302	29	2026-04-03 12:41:35.303	2026-04-03 12:41:35.303	f	\N	0	new	\N	\N	\N
539	СЧ-000539	2026-04-06 09:32:19.513	117	2026-04-06 09:32:19.515	2026-04-06 09:32:19.515	f	\N	0	new	\N	\N	\N
503	СЧ-000503	2026-04-04 10:16:34.78	58	2026-04-04 10:16:34.781	2026-04-04 10:16:34.781	f	\N	0	new	\N	\N	\N
540	СЧ-000540	2026-04-06 09:49:13.358	43	2026-04-06 09:49:13.359	2026-04-06 09:49:13.359	f	\N	0	new	\N	\N	\N
541	СЧ-000541	2026-04-06 09:59:11.868	45	2026-04-06 09:59:11.87	2026-04-06 09:59:11.87	f	\N	0	new	\N	\N	\N
502	СЧ-000502	2026-04-03 15:19:29.64	29	2026-04-03 15:19:29.642	2026-04-03 15:19:29.642	f	\N	0	new	\N	\N	\N
542	СЧ-000542	2026-04-06 09:59:26.686	45	2026-04-06 09:59:26.687	2026-04-06 09:59:26.687	f	\N	0	new	\N	\N	\N
543	СЧ-000543	2026-04-06 10:04:10.559	61	2026-04-06 10:04:10.56	2026-04-06 10:04:10.56	f	\N	0	new	\N	\N	\N
473	СЧ-000473	2026-04-02 16:10:47.934	58	2026-04-02 16:10:47.935	2026-04-11 16:30:40.362	t	2026-04-02 16:29:48.026	0	paid	INV-473-1775146252574	8257612958	https://pay.tbank.ru/kytsNcEe
475	СЧ-000475	2026-04-02 16:19:42.59	32	2026-04-02 16:19:42.591	2026-04-11 16:42:43.598	t	2026-04-02 16:41:44.885	0	paid	INV-475-1775146784040	8257653478	https://pay.tbank.ru/Lt4uGo4O
476	СЧ-000476	2026-04-02 16:25:20.313	40	2026-04-02 16:25:20.314	2026-04-12 17:01:04.872	t	2026-04-02 17:00:09.421	0	paid	INV-476-1775147127730	8257679355	https://pay.tbank.ru/S52FNkLj
238	СЧ-000238	2026-03-25 09:22:14.086	68	2026-03-25 09:22:14.087	2026-04-11 20:13:10.382	t	2026-03-26 07:12:36.125	0	paid	INV-238-1774430534947	8208784426	https://pay.tbank.ru/JhFJT0CG
436	СЧ-000436	2026-04-01 13:09:50.84	66	2026-04-01 13:09:50.841	2026-04-13 07:02:04.3	t	2026-04-02 07:00:46.354	0	paid	INV-436-1775048991548	8251205801	https://pay.tbank.ru/exYvZF6H
435	СЧ-000435	2026-04-01 13:08:37.432	66	2026-04-01 13:08:37.433	2026-04-13 07:03:34.086	t	2026-04-02 07:01:55.865	0	paid	INV-435-1775048918162	8251199414	https://pay.tbank.ru/6Ibpj1vE
346	СЧ-000345	2026-03-30 06:19:33.655	51	2026-03-30 06:19:33.656	2026-04-12 07:45:07.959	t	2026-03-30 07:43:07.562	0	paid	INV-346-1774851574623	8236900188	https://pay.tbank.ru/KJVCv9JT
396	СЧ-000396	2026-04-01 08:35:56.331	99	2026-04-01 08:35:56.332	2026-04-13 08:39:09.361	t	2026-04-01 08:37:57.242	0	paid	INV-396-1775032567620	8249691583	https://pay.tbank.ru/yhtRt3ao
234	СЧ-000234	2026-03-25 08:51:38.374	63	2026-03-25 08:51:38.374	2026-04-13 09:00:54.32	t	2026-03-25 08:53:41.662	0	paid	INV-234-1774428700209	8208585932	https://pay.tbank.ru/JwidQmIw
461	СЧ-000461	2026-04-02 09:52:44.315	58	2026-04-02 09:52:44.317	2026-04-12 09:53:52.923	t	2026-04-02 09:53:03.373	0	paid	INV-461-1775123565099	8255835222	https://pay.tbank.ru/9EL4tLKQ
459	СЧ-000459	2026-04-02 09:52:01.761	32	2026-04-02 09:52:01.762	2026-04-13 10:20:35.517	t	2026-04-02 10:19:10.862	0	paid	INV-459-1775123522535	8255831384	https://pay.tbank.ru/ZCrfSkNK
460	СЧ-000460	2026-04-02 09:52:10.808	32	2026-04-02 09:52:10.809	2026-04-13 10:20:44.228	t	2026-04-02 10:19:42.908	0	paid	INV-460-1775123531521	8255832303	https://pay.tbank.ru/7n0rtoRj
457	СЧ-000457	2026-04-02 09:44:58.06	38	2026-04-02 09:44:58.061	2026-04-13 10:25:55.151	t	2026-04-02 10:24:55.189	0	paid	INV-457-1775123098823	8255792412	https://pay.tbank.ru/BDFJh297
456	СЧ-000456	2026-04-02 09:44:40.928	38	2026-04-02 09:44:40.929	2026-04-13 10:27:35.902	t	2026-04-02 10:26:34.525	0	paid	INV-456-1775123082286	8255791144	https://pay.tbank.ru/NI4wOBMu
272	СЧ-000272	2026-03-25 10:31:07.785	82	2026-03-25 10:31:07.786	2026-04-12 10:39:22.377	t	2026-03-25 10:32:20.737	0	paid	INV-272-1774434668497	8209215787	https://pay.tbank.ru/ENLlsyDU
454	СЧ-000454	2026-04-02 09:42:49.247	40	2026-04-02 09:42:49.248	2026-04-13 11:47:45.928	t	2026-04-02 11:46:51.328	0	paid	INV-454-1775122970010	8255782324	https://pay.tbank.ru/laO9W9os
455	СЧ-000455	2026-04-02 09:43:02.169	40	2026-04-02 09:43:02.17	2026-04-13 11:48:17.709	t	2026-04-02 11:47:23.084	0	paid	INV-455-1775122983712	8255783297	https://pay.tbank.ru/oQfHfh8U
183	СЧ-000183	2026-03-20 11:16:42.335	31	2026-03-20 11:16:42.336	2026-04-13 11:52:00.859	t	2026-03-20 11:50:30.837	0	paid	INV-183-1774005403530	8180910179	https://pay.tbank.ru/fY95aCUl
421	СЧ-000421	2026-04-01 12:37:04.023	79	2026-04-01 12:37:04.024	2026-04-12 12:46:09.947	t	2026-04-01 12:45:16.246	0	paid	INV-421-1775047376463	8251070312	https://pay.tbank.ru/rYegZA5p
431	СЧ-000431	2026-04-01 13:04:26.362	93	2026-04-01 13:04:26.365	2026-04-12 13:07:13.424	t	2026-04-01 13:06:18.227	0	paid	INV-431-1775048667129	8251177148	https://pay.tbank.ru/p5jxDc0o
513	СЧ-000504	2026-04-06 06:56:03.328	120	2026-04-06 06:56:03.329	2026-04-06 06:56:03.329	f	\N	0	new	\N	\N	\N
514	СЧ-000514	2026-04-06 06:57:01.081	120	2026-04-06 06:57:01.082	2026-04-06 06:57:01.082	f	\N	0	new	\N	\N	\N
515	СЧ-000515	2026-04-06 06:57:26.259	120	2026-04-06 06:57:26.26	2026-04-06 06:57:26.26	f	\N	0	new	\N	\N	\N
516	СЧ-000516	2026-04-06 07:41:01.963	121	2026-04-06 07:41:01.965	2026-04-06 07:41:01.965	f	\N	0	new	\N	\N	\N
544	СЧ-000544	2026-04-06 10:06:33.439	53	2026-04-06 10:06:33.44	2026-04-06 10:06:33.44	f	\N	0	new	\N	\N	\N
545	СЧ-000545	2026-04-06 10:08:10.033	35	2026-04-06 10:08:10.037	2026-04-06 10:08:10.037	f	\N	0	new	\N	\N	\N
517	СЧ-000517	2026-04-06 09:07:53.564	50	2026-04-06 09:07:53.565	2026-04-06 09:07:53.565	f	\N	0	new	\N	\N	\N
546	СЧ-000546	2026-04-06 10:09:20.316	104	2026-04-06 10:09:20.318	2026-04-06 10:09:20.318	f	\N	0	new	\N	\N	\N
518	СЧ-000518	2026-04-06 09:08:41.134	33	2026-04-06 09:08:41.135	2026-04-06 09:08:41.135	f	\N	0	new	\N	\N	\N
519	СЧ-000519	2026-04-06 09:09:14.918	33	2026-04-06 09:09:14.919	2026-04-06 09:09:14.919	f	\N	0	new	\N	\N	\N
520	СЧ-000520	2026-04-06 09:10:24.434	38	2026-04-06 09:10:24.435	2026-04-06 09:10:24.435	f	\N	0	new	\N	\N	\N
521	СЧ-000521	2026-04-06 09:11:11.13	51	2026-04-06 09:11:11.132	2026-04-06 09:11:11.132	f	\N	0	new	\N	\N	\N
522	СЧ-000522	2026-04-06 09:11:25.24	51	2026-04-06 09:11:25.241	2026-04-06 09:11:25.241	f	\N	0	new	\N	\N	\N
523	СЧ-000523	2026-04-06 09:12:57.422	58	2026-04-06 09:12:57.423	2026-04-06 09:12:57.423	f	\N	0	new	\N	\N	\N
524	СЧ-000524	2026-04-06 09:13:09.735	58	2026-04-06 09:13:09.736	2026-04-06 09:13:09.736	f	\N	0	new	\N	\N	\N
525	СЧ-000525	2026-04-06 09:19:50.877	40	2026-04-06 09:19:50.879	2026-04-06 09:19:50.879	f	\N	0	new	\N	\N	\N
526	СЧ-000526	2026-04-06 09:20:50.134	32	2026-04-06 09:20:50.135	2026-04-06 09:20:50.135	f	\N	0	new	\N	\N	\N
527	СЧ-000527	2026-04-06 09:21:02.821	32	2026-04-06 09:21:02.822	2026-04-06 09:21:02.822	f	\N	0	new	\N	\N	\N
528	СЧ-000528	2026-04-06 09:21:19.615	32	2026-04-06 09:21:19.616	2026-04-06 09:21:19.616	f	\N	0	new	\N	\N	\N
529	СЧ-000529	2026-04-06 09:22:09.622	29	2026-04-06 09:22:09.623	2026-04-06 09:22:09.623	f	\N	0	new	\N	\N	\N
530	СЧ-000530	2026-04-06 09:23:35.475	29	2026-04-06 09:23:35.476	2026-04-06 09:23:35.476	f	\N	0	new	\N	\N	\N
531	СЧ-000531	2026-04-06 09:24:02.466	29	2026-04-06 09:24:02.468	2026-04-06 09:24:02.468	f	\N	0	new	\N	\N	\N
532	СЧ-000532	2026-04-06 09:28:47.399	39	2026-04-06 09:28:47.401	2026-04-06 09:28:47.401	f	\N	0	new	\N	\N	\N
533	СЧ-000533	2026-04-06 09:30:47.05	117	2026-04-06 09:30:47.051	2026-04-06 09:30:47.051	f	\N	0	new	\N	\N	\N
534	СЧ-000534	2026-04-06 09:31:00.033	117	2026-04-06 09:31:00.034	2026-04-06 09:31:00.034	f	\N	0	new	\N	\N	\N
535	СЧ-000535	2026-04-06 09:31:08.362	117	2026-04-06 09:31:08.363	2026-04-06 09:31:08.363	f	\N	0	new	\N	\N	\N
536	СЧ-000536	2026-04-06 09:31:30.588	117	2026-04-06 09:31:30.589	2026-04-06 09:31:30.589	f	\N	0	new	\N	\N	\N
537	СЧ-000537	2026-04-06 09:31:37.788	117	2026-04-06 09:31:37.789	2026-04-06 09:31:37.789	f	\N	0	new	\N	\N	\N
481	СЧ-000481	2026-04-03 12:03:00.878	86	2026-04-03 12:03:00.879	2026-04-12 13:47:21.381	t	2026-04-03 13:46:26.635	0	paid	INV-481-1775217787288	8262960957	https://pay.tbank.ru/7gRkh9Vx
499	СЧ-000499	2026-04-03 12:27:04.008	86	2026-04-03 12:27:04.009	2026-04-12 13:48:06.72	t	2026-04-03 13:47:16.891	0	paid	INV-499-1775219224928	8263121399	https://pay.tbank.ru/sSaTuTLX
309	СЧ-000309	2026-03-26 13:42:23.435	49	2026-03-26 13:42:23.436	2026-04-12 15:08:15.322	t	2026-03-26 15:07:14.654	0	paid	INV-309-1774532544067	8216716711	https://pay.tbank.ru/3CAYtiav
373	СЧ-000373	2026-03-31 08:00:39.266	58	2026-03-31 08:00:39.267	2026-04-13 08:04:07.141	t	2026-03-31 08:02:39.765	0	paid	INV-373-1774944040520	8243460237	https://pay.tbank.ru/bloKBZRb
594	СЧ-000594	2026-04-08 10:26:27.128	41	2026-04-08 10:26:27.132	2026-04-08 10:26:28.777	f	\N	0	sent	\N	\N	\N
549	СЧ-000548	2026-04-06 16:14:19.287	48	2026-04-06 16:14:19.288	2026-04-06 16:16:35.643	f	\N	0	awaiting_payment	INV-549-1775492195320	8281846384	https://pay.tbank.ru/BmtIOXao
551	СЧ-000551	2026-04-08 08:52:12.786	29	2026-04-08 08:52:12.787	2026-04-08 08:59:19.965	f	\N	0	awaiting_payment	INV-551-1775638759644	8291434363	https://pay.tbank.ru/DaoeNirM
617	СЧ-000617	2026-04-09 08:39:40.048	33	2026-04-09 08:39:40.05	2026-04-09 08:39:46.305	f	\N	0	sent	\N	\N	\N
547	СЧ-000547	2026-04-06 16:07:00.707	48	2026-04-06 16:07:00.708	2026-04-08 11:05:27.176	f	\N	0	awaiting_payment	INV-547-1775646326911	8292129608	https://pay.tbank.ru/Yzv9BKCE
618	СЧ-000618	2026-04-09 08:41:52.349	33	2026-04-09 08:41:52.35	2026-04-09 08:41:55.234	f	\N	0	sent	\N	\N	\N
619	СЧ-000619	2026-04-09 08:43:03.31	33	2026-04-09 08:43:03.311	2026-04-09 08:43:06.196	f	\N	0	sent	\N	\N	\N
437	СЧ-000437	2026-04-01 13:10:30.478	68	2026-04-01 13:10:30.48	2026-04-12 05:40:13.014	t	2026-04-02 05:38:55.014	0	paid	INV-437-1775049031291	8251209345	https://pay.tbank.ru/kLlDjWVW
602	СЧ-000602	2026-04-08 11:12:30.433	36	2026-04-08 11:12:30.434	2026-04-08 11:12:31.339	f	\N	0	sent	\N	\N	\N
620	СЧ-000620	2026-04-09 08:45:18.428	53	2026-04-09 08:45:18.429	2026-04-09 08:45:21.131	f	\N	0	sent	\N	\N	\N
614	СЧ-000614	2026-04-08 12:47:56.47	41	2026-04-08 12:47:56.472	2026-04-08 12:48:07.5	f	\N	0	awaiting_payment	INV-614-1775652487189	8292618480	https://pay.tbank.ru/0i2QWOr7
628	СЧ-000628	2026-04-09 09:33:56.67	38	2026-04-09 09:33:56.671	2026-04-09 09:33:59.012	f	\N	0	sent	\N	\N	\N
550	СЧ-000550	2026-04-08 07:56:06.715	107	2026-04-08 07:56:06.716	2026-04-08 07:56:07.638	f	\N	0	sent	\N	\N	\N
555	СЧ-000553	2026-04-08 10:02:57.022	48	2026-04-08 10:02:57.023	2026-04-08 10:02:57.957	f	\N	0	sent	\N	\N	\N
556	СЧ-000556	2026-04-08 10:05:22.462	48	2026-04-08 10:05:22.463	2026-04-08 10:05:23.505	f	\N	0	sent	\N	\N	\N
557	СЧ-000557	2026-04-08 10:10:18.308	48	2026-04-08 10:10:18.309	2026-04-08 10:10:35.124	f	\N	0	awaiting_payment	INV-557-1775643034908	8291839188	https://pay.tbank.ru/zM30aSfb
558	СЧ-000558	2026-04-08 10:10:44.588	41	2026-04-08 10:10:44.589	2026-04-08 10:10:45.441	f	\N	0	sent	\N	\N	\N
559	СЧ-000559	2026-04-08 10:10:52.452	41	2026-04-08 10:10:52.453	2026-04-08 10:10:53.172	f	\N	0	sent	\N	\N	\N
590	СЧ-000560	2026-04-08 10:24:41.215	41	2026-04-08 10:24:41.217	2026-04-08 10:24:42.995	f	\N	0	sent	\N	\N	\N
591	СЧ-000591	2026-04-08 10:25:10.079	41	2026-04-08 10:25:10.08	2026-04-08 10:25:11.023	f	\N	0	sent	\N	\N	\N
592	СЧ-000592	2026-04-08 10:25:20.277	41	2026-04-08 10:25:20.278	2026-04-08 10:25:21.08	f	\N	0	sent	\N	\N	\N
593	СЧ-000593	2026-04-08 10:25:58.785	41	2026-04-08 10:25:58.787	2026-04-08 10:25:59.835	f	\N	0	sent	\N	\N	\N
552	СЧ-000552	2026-04-08 08:55:53.457	41	2026-04-08 08:55:53.458	2026-04-13 09:01:00.424	t	2026-04-08 09:00:03.865	0	paid	INV-552-1775638765761	8291434937	https://pay.tbank.ru/3uxrv5ZF
610	СЧ-000610	2026-04-08 11:42:35.04	41	2026-04-08 11:42:35.041	2026-04-08 11:42:35.956	f	\N	0	sent	\N	\N	\N
265	СЧ-000265	2026-03-25 10:21:28.543	78	2026-03-25 10:21:28.544	2026-04-12 16:00:55.538	t	2026-03-25 15:53:56.215	0	paid	INV-265-1774434090442	8209152758	https://pay.tbank.ru/dshlJNgM
282	СЧ-000282	2026-03-25 14:37:11.035	51	2026-03-25 14:37:11.036	2026-04-12 06:11:04.82	t	2026-03-26 06:24:52.567	0	paid	INV-282-1774449434377	8210707938	https://pay.tbank.ru/Nf1BYyyi
439	СЧ-000439	2026-04-01 13:11:41.132	100	2026-04-01 13:11:41.133	2026-04-12 16:06:19.387	t	2026-04-01 16:05:22.825	0	paid	INV-439-1775049101832	8251215298	https://pay.tbank.ru/Q2DPcfAU
308	СЧ-000308	2026-03-26 13:41:07.467	38	2026-03-26 13:41:07.468	2026-04-12 16:19:47.237	t	2026-03-26 16:18:40.748	0	paid	INV-308-1774532468432	8216710081	https://pay.tbank.ru/7q67ftaC
286	СЧ-000286	2026-03-25 14:39:58.697	40	2026-03-25 14:39:58.698	2026-04-12 15:24:15.095	t	2026-03-25 15:17:19.328	0	paid	INV-286-1774449603055	8210723477	https://pay.tbank.ru/nJ0vcpqm
615	СЧ-000615	2026-04-08 14:33:54.561	48	2026-04-08 14:33:54.562	2026-04-09 07:30:59.097	f	\N	0	sent	\N	\N	\N
311	СЧ-000311	2026-03-26 13:47:21.034	38	2026-03-26 13:47:21.035	2026-04-12 16:21:33.866	t	2026-03-26 16:20:35.55	0	paid	INV-311-1774532842005	8216742372	https://pay.tbank.ru/Zl1bzd2t
245	СЧ-000245	2026-03-25 09:28:42.091	66	2026-03-25 09:28:42.092	2026-04-11 16:35:52.776	t	2026-03-25 16:28:27.247	0	paid	INV-245-1774430922885	8208820366	https://pay.tbank.ru/RAt7IRIV
164	СЧ-000163	2026-03-19 10:12:20.747	31	2026-03-19 10:12:20.748	2026-04-11 16:49:29.533	t	2026-03-19 16:48:15.427	0	paid	INV-164-1773915185705	8174592015	https://pay.tbank.ru/Kj7xkWxt
623	СЧ-000623	2026-04-09 09:23:29.329	39	2026-04-09 09:23:29.33	2026-04-09 09:23:32.523	f	\N	0	sent	\N	\N	\N
624	СЧ-000624	2026-04-09 09:26:33.347	43	2026-04-09 09:26:33.348	2026-04-09 09:26:35.922	f	\N	0	sent	\N	\N	\N
625	СЧ-000625	2026-04-09 09:29:46.917	35	2026-04-09 09:29:46.918	2026-04-09 09:29:49.84	f	\N	0	sent	\N	\N	\N
626	СЧ-000626	2026-04-09 09:33:10.562	38	2026-04-09 09:33:10.563	2026-04-09 09:33:12.996	f	\N	0	sent	\N	\N	\N
627	СЧ-000627	2026-04-09 09:33:37.76	38	2026-04-09 09:33:37.761	2026-04-09 09:33:40.178	f	\N	0	sent	\N	\N	\N
629	СЧ-000629	2026-04-09 09:35:28.532	32	2026-04-09 09:35:28.533	2026-04-09 09:35:31.04	f	\N	0	awaiting_payment	INV-629-1775727330828	8297298826	https://pay.tbank.ru/pt9wuqUN
630	СЧ-000630	2026-04-09 09:35:44.487	32	2026-04-09 09:35:44.488	2026-04-09 09:35:46.358	f	\N	0	awaiting_payment	INV-630-1775727346164	8297300240	https://pay.tbank.ru/GV3rStQp
631	СЧ-000631	2026-04-09 09:36:56.396	32	2026-04-09 09:36:56.399	2026-04-09 09:36:58.922	f	\N	0	awaiting_payment	INV-631-1775727418734	8297307132	https://pay.tbank.ru/66vNk5x5
632	СЧ-000632	2026-04-09 09:37:49.425	58	2026-04-09 09:37:49.427	2026-04-09 09:37:51.823	f	\N	0	awaiting_payment	INV-632-1775727471577	8297312206	https://pay.tbank.ru/nEyMTPWs
633	СЧ-000633	2026-04-09 09:38:51.763	58	2026-04-09 09:38:51.764	2026-04-09 09:38:55.254	f	\N	0	awaiting_payment	INV-633-1775727535042	8297318663	https://pay.tbank.ru/dwoCXSaD
634	СЧ-000634	2026-04-09 09:40:14.188	33	2026-04-09 09:40:14.189	2026-04-09 09:40:18.089	f	\N	0	sent	\N	\N	\N
635	СЧ-000635	2026-04-09 10:19:19.267	87	2026-04-09 10:19:19.268	2026-04-09 10:19:28.813	f	\N	0	sent	\N	\N	\N
637	СЧ-000637	2026-04-09 10:24:36.343	86	2026-04-09 10:24:36.344	2026-04-09 10:25:15.234	f	\N	0	awaiting_payment	INV-637-1775730315028	8297567010	https://pay.tbank.ru/uz04svS9
636	СЧ-000636	2026-04-09 10:24:26.987	64	2026-04-09 10:24:26.988	2026-04-09 10:25:18.351	f	\N	0	awaiting_payment	INV-636-1775730318032	8297567259	https://pay.tbank.ru/nWmqeRk3
641	СЧ-000641	2026-04-09 10:27:45.47	98	2026-04-09 10:27:45.471	2026-04-09 10:28:31.025	f	\N	0	sent	\N	\N	\N
642	СЧ-000642	2026-04-09 10:28:14.922	75	2026-04-09 10:28:14.923	2026-04-12 10:56:00.355	t	2026-04-09 10:55:13.95	0	paid	INV-642-1775730507460	8297583322	https://pay.tbank.ru/eSJl0Luf
640	СЧ-000640	2026-04-09 10:26:40.76	79	2026-04-09 10:26:40.761	2026-04-13 11:05:38.589	t	2026-04-09 11:04:59.027	0	paid	INV-640-1775730514063	8297583865	https://pay.tbank.ru/GkM1DKvr
621	СЧ-000621	2026-04-09 09:16:19.885	51	2026-04-09 09:16:19.886	2026-04-12 12:10:10.57	t	2026-04-09 12:09:28.935	0	paid	INV-621-1775726182647	8297196322	https://pay.tbank.ru/L6Qf8KuN
616	СЧ-000616	2026-04-09 08:04:33.413	159	2026-04-09 08:04:33.414	2026-04-12 05:33:48.812	t	2026-04-10 05:33:07.415	0	paid	INV-616-1775721892380	8296814364	https://pay.tbank.ru/TNtyX6UV
643	СЧ-000643	2026-04-09 10:29:12.917	56	2026-04-09 10:29:12.918	2026-04-09 10:30:22.65	f	\N	0	sent	\N	\N	\N
645	СЧ-000645	2026-04-09 10:30:01.229	83	2026-04-09 10:30:01.23	2026-04-09 10:31:07.735	f	\N	0	awaiting_payment	INV-645-1775730667421	8297597367	https://pay.tbank.ru/cCMorNiq
646	СЧ-000646	2026-04-09 10:32:07.165	72	2026-04-09 10:32:07.165	2026-04-09 10:32:18.052	f	\N	0	awaiting_payment	INV-646-1775730737750	8297603720	https://pay.tbank.ru/87nRp7RD
677	СЧ-000677	2026-04-10 08:23:10.657	36	2026-04-10 08:23:10.658	2026-04-10 08:23:13.699	f	\N	0	awaiting_payment	INV-677-1775809393447	8302742210	https://pay.tbank.ru/Pvw4Tf9j
666	СЧ-000666	2026-04-09 13:29:38.509	41	2026-04-09 13:29:38.51	2026-04-09 13:29:38.51	f	\N	0	new	\N	\N	\N
649	СЧ-000649	2026-04-09 10:51:47.737	75	2026-04-09 10:51:47.738	2026-04-12 10:56:07.146	t	2026-04-09 10:55:34.297	0	paid	INV-649-1775732009133	8297719926	https://pay.tbank.ru/OrPolLBJ
667	СЧ-000667	2026-04-09 13:30:03.97	38	2026-04-09 13:30:03.971	2026-04-09 13:30:07.226	f	\N	0	sent	\N	\N	\N
647	СЧ-000647	2026-04-09 10:50:39.925	87	2026-04-09 10:50:39.926	2026-04-09 10:50:51.456	f	\N	0	sent	\N	\N	\N
648	СЧ-000648	2026-04-09 10:51:13.526	87	2026-04-09 10:51:13.527	2026-04-09 10:53:25.539	f	\N	0	sent	\N	\N	\N
656	СЧ-000656	2026-04-09 12:48:15.596	117	2026-04-09 12:48:15.597	2026-04-09 12:48:18.87	f	\N	0	sent	\N	\N	\N
652	СЧ-000652	2026-04-09 10:56:16.645	33	2026-04-09 10:56:16.646	2026-04-09 10:56:39.225	f	\N	0	sent	\N	\N	\N
657	СЧ-000657	2026-04-09 12:53:54.765	56	2026-04-09 12:53:54.766	2026-04-09 12:53:54.766	f	\N	0	new	\N	\N	\N
668	СЧ-000668	2026-04-09 13:30:37.418	33	2026-04-09 13:30:37.419	2026-04-09 13:30:39.953	f	\N	0	sent	\N	\N	\N
651	СЧ-000651	2026-04-09 10:53:10.643	56	2026-04-09 10:53:10.644	2026-04-09 10:59:20.844	f	\N	0	sent	\N	\N	\N
654	СЧ-000654	2026-04-09 11:01:10.638	64	2026-04-09 11:01:10.639	2026-04-09 11:01:17.078	f	\N	0	awaiting_payment	INV-654-1775732476826	8297757566	https://pay.tbank.ru/U5efPZUA
653	СЧ-000653	2026-04-09 11:00:55.178	44	2026-04-09 11:00:55.182	2026-04-09 11:01:21.677	f	\N	0	sent	\N	\N	\N
678	СЧ-000678	2026-04-10 08:24:11.205	100	2026-04-10 08:24:11.206	2026-04-10 08:24:14.221	f	\N	0	awaiting_payment	INV-678-1775809453964	8302747641	https://pay.tbank.ru/fXZlynJn
669	СЧ-000669	2026-04-09 13:31:53.968	32	2026-04-09 13:31:53.969	2026-04-09 13:31:58.395	f	\N	0	awaiting_payment	INV-669-1775741518115	8298475763	https://pay.tbank.ru/bOydj01d
671	СЧ-000671	2026-04-09 13:55:58.665	40	2026-04-09 13:55:58.666	2026-04-12 13:59:58.668	t	2026-04-09 13:59:17.736	0	paid	INV-671-1775742960763	8298586878	https://pay.tbank.ru/ewbrj5np
679	СЧ-000679	2026-04-10 08:26:03.819	83	2026-04-10 08:26:03.82	2026-04-10 08:26:06.865	f	\N	0	awaiting_payment	INV-679-1775809566611	8302757664	https://pay.tbank.ru/ITHYViO8
658	СЧ-000658	2026-04-09 12:59:41.874	117	2026-04-09 12:59:41.875	2026-04-09 12:59:45.264	f	\N	0	sent	\N	\N	\N
659	СЧ-000659	2026-04-09 13:02:38.619	45	2026-04-09 13:02:38.62	2026-04-09 13:02:41.873	f	\N	0	sent	\N	\N	\N
660	СЧ-000660	2026-04-09 13:03:23.568	39	2026-04-09 13:03:23.569	2026-04-09 13:03:26.335	f	\N	0	sent	\N	\N	\N
670	СЧ-000670	2026-04-09 13:36:37.811	53	2026-04-09 13:36:37.812	2026-04-09 13:36:40.161	f	\N	0	sent	\N	\N	\N
661	СЧ-000661	2026-04-09 13:06:50.903	29	2026-04-09 13:06:50.905	2026-04-09 13:06:53.638	f	\N	0	sent	\N	\N	\N
662	СЧ-000662	2026-04-09 13:07:43.992	43	2026-04-09 13:07:43.993	2026-04-09 13:07:47.087	f	\N	0	sent	\N	\N	\N
665	СЧ-000665	2026-04-09 13:22:30.982	35	2026-04-09 13:22:30.983	2026-04-09 13:39:54.411	f	\N	0	sent	\N	\N	\N
663	СЧ-000663	2026-04-09 13:08:18.698	58	2026-04-09 13:08:18.699	2026-04-09 13:08:21.089	f	\N	0	sent	\N	\N	\N
622	СЧ-000622	2026-04-09 09:19:10.27	79	2026-04-09 09:19:10.271	2026-04-13 11:05:23.731	t	2026-04-09 11:04:41.83	0	paid	INV-622-1775726354607	8297210944	https://pay.tbank.ru/qJL7xHs1
680	СЧ-000680	2026-04-10 08:26:44.666	86	2026-04-10 08:26:44.667	2026-04-10 08:26:48.459	f	\N	0	awaiting_payment	INV-680-1775809608219	8302761243	https://pay.tbank.ru/mSy0Cosy
681	СЧ-000681	2026-04-10 08:28:24.785	115	2026-04-10 08:28:24.786	2026-04-10 08:28:24.786	f	\N	0	new	\N	\N	\N
655	СЧ-000655	2026-04-09 11:19:13.337	51	2026-04-09 11:19:13.338	2026-04-13 12:11:42.868	t	2026-04-09 12:10:55.134	0	paid	INV-655-1775733561577	8297842251	https://pay.tbank.ru/7zy9iRaH
664	СЧ-000664	2026-04-09 13:21:51.646	41	2026-04-09 13:21:51.647	2026-04-09 13:21:51.647	f	\N	0	new	\N	\N	\N
673	СЧ-000673	2026-04-10 08:18:00.142	33	2026-04-10 08:18:00.144	2026-04-10 08:18:14.929	f	\N	0	sent	\N	\N	\N
684	СЧ-000684	2026-04-10 08:38:01.484	121	2026-04-10 08:38:01.486	2026-04-10 08:38:04.954	f	\N	0	awaiting_payment	INV-684-1775810284739	8302824128	https://pay.tbank.ru/GGD6cYud
674	СЧ-000674	2026-04-10 08:18:53.192	103	2026-04-10 08:18:53.193	2026-04-10 08:19:07.082	f	\N	0	sent	\N	\N	\N
672	СЧ-000672	2026-04-10 07:37:33.644	91	2026-04-10 07:37:33.645	2026-04-10 07:37:40.722	f	\N	0	awaiting_payment	INV-672-1775806660465	8302457306	https://pay.tbank.ru/vlygLTTt
638	СЧ-000638	2026-04-09 10:24:44.752	75	2026-04-09 10:24:44.753	2026-04-12 10:55:29.499	t	2026-04-09 10:54:44.46	0	paid	INV-638-1775730310528	8297566665	https://pay.tbank.ru/gAKGDjqJ
675	СЧ-000675	2026-04-10 08:19:39.169	114	2026-04-10 08:19:39.17	2026-04-10 08:19:42.002	f	\N	0	awaiting_payment	INV-675-1775809181741	8302721416	https://pay.tbank.ru/pLubuHZY
676	СЧ-000676	2026-04-10 08:20:28.446	119	2026-04-10 08:20:28.448	2026-04-10 08:20:47.663	f	\N	0	awaiting_payment	INV-676-1775809247442	8302727937	https://pay.tbank.ru/dL1Os8PZ
639	СЧ-000639	2026-04-09 10:25:49.591	119	2026-04-09 10:25:49.592	2026-04-13 10:29:01.573	t	2026-04-09 10:28:18.485	0	paid	INV-639-1775730357702	8297570363	https://pay.tbank.ru/21BTxRuB
682	СЧ-000682	2026-04-10 08:35:15.223	118	2026-04-10 08:35:15.225	2026-04-10 08:35:15.225	f	\N	0	new	\N	\N	\N
644	СЧ-000644	2026-04-09 10:29:28.103	122	2026-04-09 10:29:28.104	2026-04-12 10:36:15.066	t	2026-04-09 10:35:32.308	0	paid	INV-644-1775730661816	8297596875	https://pay.tbank.ru/b2dR7Nr0
683	СЧ-000683	2026-04-10 08:36:23.445	50	2026-04-10 08:36:23.447	2026-04-10 08:36:40.783	f	\N	0	sent	\N	\N	\N
686	СЧ-000686	2026-04-10 08:42:00.179	64	2026-04-10 08:42:00.181	2026-04-10 08:42:03.003	f	\N	0	awaiting_payment	INV-686-1775810522766	8302848305	https://pay.tbank.ru/FPliMMzz
687	СЧ-000687	2026-04-10 08:42:38.181	50	2026-04-10 08:42:38.182	2026-04-10 08:43:36.812	f	\N	0	awaiting_payment	INV-687-1775810616546	8302857984	https://pay.tbank.ru/RenI6XdI
688	СЧ-000688	2026-04-10 08:44:52.432	104	2026-04-10 08:44:52.433	2026-04-10 08:45:05.557	f	\N	0	sent	\N	\N	\N
691	СЧ-000691	2026-04-10 08:48:15.071	85	2026-04-10 08:48:15.072	2026-04-10 08:48:18.196	f	\N	0	awaiting_payment	INV-691-1775810897940	8302887244	https://pay.tbank.ru/w1maFiZR
692	СЧ-000692	2026-04-10 08:49:02.415	67	2026-04-10 08:49:02.416	2026-04-10 08:49:16.354	f	\N	0	sent	\N	\N	\N
693	СЧ-000693	2026-04-10 08:50:25.901	107	2026-04-10 08:50:25.902	2026-04-10 08:50:28.881	f	\N	0	awaiting_payment	INV-693-1775811028627	8302900736	https://pay.tbank.ru/qRkkSTuN
694	СЧ-000694	2026-04-10 08:53:07.857	86	2026-04-10 08:53:07.858	2026-04-10 08:53:10.588	f	\N	0	awaiting_payment	INV-694-1775811190299	8302917413	https://pay.tbank.ru/mtHATLYF
690	СЧ-000690	2026-04-10 08:48:10.545	41	2026-04-10 08:48:10.546	2026-04-10 10:17:06.275	f	\N	0	awaiting_payment	INV-690-1775816226003	8303455440	https://pay.tbank.ru/O2BxjUa6
685	СЧ-000685	2026-04-10 08:40:19.415	114	2026-04-10 08:40:19.417	2026-04-13 12:04:14.123	t	2026-04-13 11:04:05.539	0	paid	INV-685-1776078008332	8320963404	https://pay.tbank.ru/iypmZcKR
689	СЧ-000689	2026-04-10 08:47:23.508	114	2026-04-10 08:47:23.51	2026-04-13 12:04:40.687	t	2026-04-13 11:04:35.183	0	paid	INV-689-1776078011421	8320963727	https://pay.tbank.ru/ZTIN5cUf
695	СЧ-000695	2026-04-10 08:53:52.311	36	2026-04-10 08:53:52.312	2026-04-10 08:53:54.871	f	\N	0	awaiting_payment	INV-695-1775811234617	8302921835	https://pay.tbank.ru/Ifio82oR
696	СЧ-000696	2026-04-10 08:55:06.663	109	2026-04-10 08:55:06.664	2026-04-10 08:55:09.41	f	\N	0	awaiting_payment	INV-696-1775811309144	8302929437	https://pay.tbank.ru/o7IDIa05
697	СЧ-000697	2026-04-10 08:55:47.684	120	2026-04-10 08:55:47.685	2026-04-10 08:55:50.35	f	\N	0	awaiting_payment	INV-697-1775811350046	8302933734	https://pay.tbank.ru/pGQyzVKZ
699	СЧ-000699	2026-04-10 08:57:14.348	42	2026-04-10 08:57:14.349	2026-04-10 08:57:31.162	f	\N	0	sent	\N	\N	\N
700	СЧ-000700	2026-04-10 08:58:26.584	71	2026-04-10 08:58:26.585	2026-04-10 08:58:40.649	f	\N	0	sent	\N	\N	\N
701	СЧ-000701	2026-04-10 08:59:48.18	52	2026-04-10 08:59:48.181	2026-04-10 09:00:01.13	f	\N	0	sent	\N	\N	\N
702	СЧ-000702	2026-04-10 09:01:41.106	84	2026-04-10 09:01:41.107	2026-04-10 09:01:43.809	f	\N	0	awaiting_payment	INV-702-1775811703544	8302972114	https://pay.tbank.ru/TuvLySBV
703	СЧ-000703	2026-04-10 09:04:54.622	52	2026-04-10 09:04:54.623	2026-04-10 09:05:07.478	f	\N	0	sent	\N	\N	\N
704	СЧ-000704	2026-04-10 09:10:51.118	29	2026-04-10 09:10:51.12	2026-04-10 09:11:06.954	f	\N	0	sent	\N	\N	\N
705	СЧ-000705	2026-04-10 09:12:03.467	29	2026-04-10 09:12:03.468	2026-04-10 09:12:16.473	f	\N	0	sent	\N	\N	\N
706	СЧ-000706	2026-04-10 09:19:32.709	29	2026-04-10 09:19:32.71	2026-04-10 09:19:46.91	f	\N	0	sent	\N	\N	\N
707	СЧ-000707	2026-04-10 09:23:29.801	29	2026-04-10 09:23:29.802	2026-04-10 09:23:48.375	f	\N	0	sent	\N	\N	\N
709	СЧ-000709	2026-04-10 09:27:45.152	29	2026-04-10 09:27:45.153	2026-04-10 09:27:59.745	f	\N	0	sent	\N	\N	\N
708	СЧ-000708	2026-04-10 09:26:55.093	29	2026-04-10 09:26:55.094	2026-04-10 09:28:59.922	f	\N	0	sent	\N	\N	\N
725	СЧ-000725	2026-04-10 13:00:10.315	83	2026-04-10 13:00:10.316	2026-04-10 13:00:12.827	f	\N	0	awaiting_payment	INV-725-1775826012564	8304456677	https://pay.tbank.ru/QyH88AlM
711	СЧ-000711	2026-04-10 12:41:14.859	56	2026-04-10 12:41:14.86	2026-04-13 08:45:04.845	f	\N	0	sent	\N	\N	\N
710	СЧ-000710	2026-04-10 12:40:04.933	89	2026-04-10 12:40:04.934	2026-04-10 12:40:18.997	f	\N	0	sent	\N	\N	\N
712	СЧ-000712	2026-04-10 12:42:24.512	70	2026-04-10 12:42:24.512	2026-04-10 12:42:37.705	f	\N	0	sent	\N	\N	\N
713	СЧ-000713	2026-04-10 12:42:51.219	52	2026-04-10 12:42:51.22	2026-04-10 12:43:04.082	f	\N	0	sent	\N	\N	\N
714	СЧ-000714	2026-04-10 12:45:18.029	106	2026-04-10 12:45:18.03	2026-04-10 12:45:24.819	f	\N	0	sent	\N	\N	\N
715	СЧ-000715	2026-04-10 12:47:02.548	132	2026-04-10 12:47:02.549	2026-04-10 12:47:15.827	f	\N	0	sent	\N	\N	\N
716	СЧ-000716	2026-04-10 12:48:23.465	23	2026-04-10 12:48:23.466	2026-04-10 12:48:53.773	f	\N	0	sent	\N	\N	\N
717	СЧ-000717	2026-04-10 12:52:31.775	73	2026-04-10 12:52:31.776	2026-04-10 12:52:31.776	f	\N	0	new	\N	\N	\N
718	СЧ-000718	2026-04-10 12:54:48.308	70	2026-04-10 12:54:48.309	2026-04-10 12:55:01.665	f	\N	0	sent	\N	\N	\N
719	СЧ-000719	2026-04-10 12:55:36.16	158	2026-04-10 12:55:36.161	2026-04-10 12:55:38.902	f	\N	0	awaiting_payment	INV-719-1775825738545	8304429718	https://pay.tbank.ru/AsOtmHoZ
721	СЧ-000721	2026-04-10 12:56:51.463	132	2026-04-10 12:56:51.464	2026-04-10 12:56:54.335	f	\N	0	sent	\N	\N	\N
722	СЧ-000722	2026-04-10 12:57:34.475	84	2026-04-10 12:57:34.476	2026-04-10 12:57:37.138	f	\N	0	awaiting_payment	INV-722-1775825856901	8304440962	https://pay.tbank.ru/UMUnilQX
723	СЧ-000723	2026-04-10 12:58:08.093	36	2026-04-10 12:58:08.095	2026-04-10 12:58:10.719	f	\N	0	awaiting_payment	INV-723-1775825890519	8304444270	https://pay.tbank.ru/GMBZsCEC
724	СЧ-000724	2026-04-10 12:59:11.071	70	2026-04-10 12:59:11.072	2026-04-10 12:59:24.284	f	\N	0	sent	\N	\N	\N
726	СЧ-000726	2026-04-10 13:01:42.945	57	2026-04-10 13:01:42.946	2026-04-10 13:01:42.946	f	\N	0	new	\N	\N	\N
727	СЧ-000727	2026-04-10 13:02:37.277	23	2026-04-10 13:02:37.282	2026-04-10 13:02:50.41	f	\N	0	sent	\N	\N	\N
730	СЧ-000730	2026-04-10 13:23:43.386	71	2026-04-10 13:23:43.387	2026-04-10 13:24:14.149	f	\N	0	sent	\N	\N	\N
728	СЧ-000728	2026-04-10 13:03:49.396	90	2026-04-10 13:03:49.397	2026-04-13 08:45:45.121	f	\N	0	awaiting_payment	INV-728-1776069944927	8320342517	https://pay.tbank.ru/s6qxbxLd
732	СЧ-000731	2026-04-13 11:00:56.575	52	2026-04-13 11:00:56.576	2026-04-13 11:01:10.583	f	\N	0	sent	\N	\N	\N
720	СЧ-000720	2026-04-10 12:56:13.307	79	2026-04-10 12:56:13.308	2026-04-11 19:29:36.814	t	2026-04-10 19:29:01.259	0	paid	INV-720-1775825786461	8304434301	https://pay.tbank.ru/gauFkF0a
698	СЧ-000698	2026-04-10 08:56:33.304	114	2026-04-10 08:56:33.305	2026-04-13 12:05:12.438	t	2026-04-13 11:04:58.108	0	paid	INV-698-1776078013587	8320963916	https://pay.tbank.ru/2oDJMW7A
733	СЧ-000733	2026-04-13 12:05:09.274	18	2026-04-13 12:05:09.275	2026-04-13 12:05:13.117	f	\N	0	sent	\N	\N	\N
284	СЧ-000284	2026-03-25 14:38:25.399	32	2026-03-25 14:38:25.4	2026-04-12 17:38:29.357	t	2026-03-25 17:30:53.194	0	paid	INV-284-1774449506195	8210714454	https://pay.tbank.ru/SFJjEA3O
729	СЧ-000729	2026-04-10 13:04:34.298	120	2026-04-10 13:04:34.299	2026-04-13 08:32:59.635	f	\N	0	awaiting_payment	INV-729-1776069179315	8320280641	https://pay.tbank.ru/XQT9lr8L
650	СЧ-000650	2026-04-09 10:52:08.476	63	2026-04-09 10:52:08.477	2026-04-13 11:19:36.792	t	2026-04-09 11:18:50.212	0	paid	INV-650-1775732012096	8297720178	https://pay.tbank.ru/2IvW1f6z
\.


--
-- Data for Name: managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.managers (id, email, name, password_hash, created_at) FROM stdin;
1	admin@example.com	Admin	$2a$10$PCQkXTUBMPk0BoUnyZPZm.kzxy3cBIgnHcm57JEFEyV2OxixFhBP.	2026-02-18 06:33:47.162
2	test@mail.ru	Test Admin	$2a$10$NqcMzewGXjZo/6gGvP8S5O.K4HgAWEPjP5HeJroc8aekXnqAI4FYW	2026-02-18 09:32:31.283
\.


--
-- Data for Name: pallet_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pallet_types (id, name, min_value, max_value, comment, created_at, updated_at) FROM stdin;
1	от 0 кг до 300 кг	0	300	\N	2026-02-26 18:23:58.529	2026-03-12 09:15:13.81
2	от 301 кг до 400 кг	301	400	\N	2026-02-26 18:23:58.529	2026-03-16 15:33:10.102
3	от 401 кг до 500 кг	401	500	\N	2026-02-26 18:23:58.529	2026-03-16 15:33:23.57
\.


--
-- Data for Name: price_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_rates (id, unit, price, comment, created_at, updated_at, city_id, box_type_id, pallet_type_id) FROM stdin;
20	boxes	750	\N	2026-02-24 16:02:20.844	2026-02-24 16:02:20.844	2	2	\N
21	boxes	850	\N	2026-02-24 16:02:25.912	2026-02-24 16:02:25.912	2	3	\N
19	boxes	650	\N	2026-02-24 16:02:08.825	2026-02-26 07:45:26.935	2	1	\N
23	pallet	5000	\N	2026-02-26 18:26:29.804	2026-02-26 18:26:29.804	2	\N	1
25	pallet	7000	\N	2026-02-26 18:26:39.535	2026-02-26 18:26:39.535	2	\N	3
24	pallet	6000	\N	2026-02-26 18:26:35.577	2026-02-26 18:26:58.061	2	\N	2
28	boxes	4300	\N	2026-02-26 20:03:48.523	2026-03-05 07:21:11.067	2	83	\N
29	pallet	5300	\N	2026-03-16 04:23:58.469	2026-03-16 04:23:58.469	1	\N	1
32	pallet	5300	\N	2026-03-16 04:24:42.301	2026-03-16 04:24:42.301	15	\N	1
33	pallet	6350	\N	2026-03-16 04:24:52.771	2026-03-16 04:24:52.771	15	\N	2
34	pallet	7400	\N	2026-03-16 04:25:06.706	2026-03-16 04:25:06.706	15	\N	3
35	boxes	700	\N	2026-03-16 04:25:22.761	2026-03-16 04:25:49.493	15	1	\N
36	boxes	800	\N	2026-03-16 04:26:03.146	2026-03-16 04:26:03.146	15	2	\N
37	boxes	900	\N	2026-03-16 04:26:11.065	2026-03-16 04:26:11.065	15	3	\N
38	boxes	4500	\N	2026-03-16 04:27:43.813	2026-03-16 04:27:43.813	15	83	\N
39	boxes	4500	\N	2026-03-16 04:27:52.235	2026-03-16 04:27:52.235	1	83	\N
40	boxes	700	\N	2026-03-16 04:27:58.083	2026-03-16 04:27:58.083	1	1	\N
42	boxes	900	\N	2026-03-16 04:28:07.496	2026-03-16 04:28:07.496	1	3	\N
43	boxes	790	\N	2026-03-16 04:28:53.631	2026-03-16 04:28:53.631	17	1	\N
44	boxes	890	\N	2026-03-16 04:28:58.728	2026-03-16 04:28:58.728	17	2	\N
45	boxes	990	\N	2026-03-16 04:29:04.63	2026-03-16 04:29:04.63	17	3	\N
46	boxes	5000	\N	2026-03-16 04:29:13.484	2026-03-16 04:29:13.484	17	83	\N
47	pallet	6800	\N	2026-03-16 04:29:31.12	2026-03-16 04:29:31.12	17	\N	1
48	pallet	7800	\N	2026-03-16 04:29:40.37	2026-03-16 04:29:40.37	17	\N	2
50	boxes	750	\N	2026-03-16 04:30:10.224	2026-03-16 04:30:10.224	12	1	\N
51	boxes	850	\N	2026-03-16 04:30:21.343	2026-03-16 04:30:21.343	12	2	\N
52	boxes	950	\N	2026-03-16 04:30:26.793	2026-03-16 04:30:26.793	12	3	\N
53	pallet	6300	\N	2026-03-16 04:30:42.483	2026-03-16 04:30:42.483	12	\N	1
54	pallet	7350	\N	2026-03-16 04:30:49.169	2026-03-16 04:30:49.169	12	\N	2
55	pallet	8400	\N	2026-03-16 04:30:59.321	2026-03-16 04:30:59.321	12	\N	3
56	boxes	4750	\N	2026-03-16 04:31:21.24	2026-03-16 04:31:21.24	12	83	\N
57	boxes	750	\N	2026-03-16 04:31:36.993	2026-03-16 04:31:36.993	3	1	\N
58	boxes	850	\N	2026-03-16 04:31:43.346	2026-03-16 04:31:43.346	3	2	\N
59	boxes	950	\N	2026-03-16 04:31:50.498	2026-03-16 04:31:50.498	3	3	\N
60	boxes	4750	\N	2026-03-16 04:31:59.014	2026-03-16 04:31:59.014	3	83	\N
61	pallet	6300	\N	2026-03-16 04:32:06.732	2026-03-16 04:32:06.732	3	\N	1
62	pallet	7350	\N	2026-03-16 04:32:13.817	2026-03-16 04:32:13.817	3	\N	2
63	pallet	8400	\N	2026-03-16 04:32:23.637	2026-03-16 04:32:23.637	3	\N	3
64	boxes	750	\N	2026-03-16 04:32:36.919	2026-03-16 04:32:36.919	14	1	\N
65	boxes	850	\N	2026-03-16 04:32:41.322	2026-03-16 04:32:41.322	14	2	\N
66	boxes	950	\N	2026-03-16 04:32:47.055	2026-03-16 04:32:47.055	14	3	\N
67	boxes	4750	\N	2026-03-16 04:33:25	2026-03-16 04:33:25	14	83	\N
68	pallet	6300	\N	2026-03-16 04:33:35.922	2026-03-16 04:33:35.922	14	\N	1
69	pallet	7350	\N	2026-03-16 04:33:45.108	2026-03-16 04:33:45.108	14	\N	2
70	pallet	8400	\N	2026-03-16 04:33:50.206	2026-03-16 04:33:50.206	14	\N	3
71	boxes	650	\N	2026-03-16 04:41:52.324	2026-03-16 04:41:52.324	7	1	\N
72	boxes	750	\N	2026-03-16 04:42:02.721	2026-03-16 04:42:02.721	7	2	\N
73	boxes	850	\N	2026-03-16 04:42:12.858	2026-03-16 04:42:12.858	7	3	\N
74	boxes	4250	\N	2026-03-16 04:44:10.706	2026-03-16 04:44:10.706	7	83	\N
75	pallet	5000	\N	2026-03-16 04:44:29.381	2026-03-16 04:44:29.381	7	\N	1
76	pallet	6000	\N	2026-03-16 04:44:35.812	2026-03-16 04:44:35.812	7	\N	2
77	pallet	7000	\N	2026-03-16 04:44:44.914	2026-03-16 04:44:44.914	7	\N	3
78	boxes	790	\N	2026-03-16 04:45:24.733	2026-03-16 04:45:24.733	9	1	\N
79	boxes	890	\N	2026-03-16 04:45:31.501	2026-03-16 04:45:31.501	9	2	\N
80	boxes	990	\N	2026-03-16 04:45:37.435	2026-03-16 04:45:37.435	9	3	\N
81	boxes	5250	\N	2026-03-16 04:45:45.821	2026-03-16 04:45:45.821	9	83	\N
82	pallet	7900	\N	2026-03-16 04:45:57.525	2026-03-16 04:45:57.525	9	\N	1
83	pallet	8900	\N	2026-03-16 04:46:04.896	2026-03-16 04:46:04.896	9	\N	2
84	pallet	9900	\N	2026-03-16 04:46:12.259	2026-03-16 04:46:12.259	9	\N	3
85	boxes	790	\N	2026-03-16 04:46:23.778	2026-03-16 04:46:23.778	8	1	\N
86	boxes	890	\N	2026-03-16 04:46:28.177	2026-03-16 04:46:28.177	8	2	\N
87	boxes	990	\N	2026-03-16 04:46:33.294	2026-03-16 04:46:33.294	8	3	\N
88	boxes	5250	\N	2026-03-16 04:46:40.949	2026-03-16 04:46:40.949	8	83	\N
89	pallet	7900	\N	2026-03-16 04:46:48.93	2026-03-16 04:46:48.93	8	\N	1
90	pallet	8900	\N	2026-03-16 04:46:53.196	2026-03-16 04:46:53.196	8	\N	2
91	pallet	9900	\N	2026-03-16 04:47:01.784	2026-03-16 04:47:01.784	8	\N	3
92	boxes	790	\N	2026-03-16 04:49:20.719	2026-03-16 04:49:20.719	10	1	\N
93	boxes	890	\N	2026-03-16 04:49:26.549	2026-03-16 04:49:26.549	10	2	\N
94	boxes	990	\N	2026-03-16 04:49:32.383	2026-03-16 04:49:32.383	10	3	\N
95	boxes	5250	\N	2026-03-16 04:49:40.572	2026-03-16 04:49:40.572	10	83	\N
97	pallet	8900	\N	2026-03-16 04:49:55.638	2026-03-16 04:49:55.638	10	\N	2
98	pallet	9900	\N	2026-03-16 04:50:01.57	2026-03-16 04:50:01.57	10	\N	3
99	boxes	840	\N	2026-03-16 04:50:19.393	2026-03-16 04:50:19.393	16	1	\N
100	boxes	940	\N	2026-03-16 04:50:25.375	2026-03-16 04:50:25.375	16	2	\N
101	boxes	1040	\N	2026-03-16 04:50:30.961	2026-03-16 04:50:30.961	16	3	\N
102	boxes	5500	\N	2026-03-16 04:50:40.747	2026-03-16 04:50:40.747	16	83	\N
103	pallet	8300	\N	2026-03-16 04:51:08.702	2026-03-16 04:51:08.702	16	\N	1
104	pallet	9300	\N	2026-03-16 04:51:16.171	2026-03-16 04:51:16.171	16	\N	2
105	pallet	10300	\N	2026-03-16 04:51:22.073	2026-03-16 04:51:22.073	16	\N	3
106	boxes	840	\N	2026-03-16 04:57:11.939	2026-03-16 04:57:11.939	5	1	\N
107	boxes	940	\N	2026-03-16 04:57:26.796	2026-03-16 04:57:26.796	5	2	\N
108	boxes	1040	\N	2026-03-16 04:57:35.642	2026-03-16 04:57:35.642	5	3	\N
109	boxes	5500	\N	2026-03-16 04:57:48.643	2026-03-16 04:57:48.643	5	83	\N
110	pallet	8300	\N	2026-03-16 04:58:01.37	2026-03-16 04:58:01.37	5	\N	1
111	pallet	9300	\N	2026-03-16 04:58:07.998	2026-03-16 04:58:07.998	5	\N	2
112	pallet	10300	\N	2026-03-16 04:58:14.397	2026-03-16 04:58:14.397	5	\N	3
113	boxes	840	\N	2026-03-16 04:59:24.728	2026-03-16 04:59:24.728	21	1	\N
114	boxes	940	\N	2026-03-16 04:59:30.094	2026-03-16 04:59:30.094	21	2	\N
115	boxes	1040	\N	2026-03-16 04:59:36.557	2026-03-16 04:59:36.557	21	3	\N
116	boxes	5500	\N	2026-03-16 05:00:13.755	2026-03-16 05:00:13.755	21	83	\N
117	pallet	8300	\N	2026-03-16 05:00:20.97	2026-03-16 05:00:20.97	21	\N	1
118	pallet	9300	\N	2026-03-16 05:00:28.555	2026-03-16 05:00:28.555	21	\N	2
119	pallet	10300	\N	2026-03-16 05:00:35.192	2026-03-16 05:00:35.192	21	\N	3
120	boxes	1000	\N	2026-03-16 05:00:53.576	2026-03-16 05:00:53.576	13	1	\N
121	boxes	1100	\N	2026-03-16 05:00:58.876	2026-03-16 05:00:58.876	13	2	\N
122	boxes	1200	\N	2026-03-16 05:01:03.53	2026-03-16 05:01:03.53	13	3	\N
123	boxes	7500	\N	2026-03-16 05:01:16.401	2026-03-16 05:01:16.401	13	83	\N
124	pallet	11000	\N	2026-03-16 05:01:27.385	2026-03-16 05:01:27.385	13	\N	1
125	pallet	12500	\N	2026-03-16 05:01:34.053	2026-03-16 05:01:34.053	13	\N	2
126	pallet	14000	\N	2026-03-16 05:01:41.002	2026-03-16 05:01:41.002	13	\N	3
127	boxes	900	\N	2026-03-16 05:13:52.047	2026-03-16 05:13:52.047	4	1	\N
96	pallet	7900	\N	2026-03-16 04:49:49.088	2026-03-25 10:14:07.528	10	\N	1
31	pallet	7400	\N	2026-03-16 04:24:28.43	2026-03-16 16:30:13.304	1	\N	3
30	pallet	6350	\N	2026-03-16 04:24:14.873	2026-03-16 16:30:09.621	1	\N	2
49	pallet	8900	\N	2026-03-16 04:29:47.171	2026-03-16 16:41:54.684	17	\N	3
128	boxes	1000	\N	2026-03-16 05:14:00.401	2026-03-16 05:14:00.401	4	2	\N
129	boxes	1100	\N	2026-03-16 05:14:09.27	2026-03-16 05:14:09.27	4	3	\N
130	boxes	6500	\N	2026-03-16 05:14:17.303	2026-03-16 05:15:17.232	4	83	\N
131	pallet	9500	\N	2026-03-16 05:16:22.597	2026-03-16 05:16:22.597	4	\N	1
132	pallet	10500	\N	2026-03-16 05:16:31.464	2026-03-16 05:16:31.464	4	\N	2
133	pallet	12000	\N	2026-03-16 05:16:40.134	2026-03-16 05:16:40.134	4	\N	3
41	boxes	800	\N	2026-03-16 04:28:02.738	2026-03-16 16:29:41.735	1	2	\N
134	boxes	10	\N	2026-03-18 11:13:14.054	2026-03-18 11:13:14.054	24	3	\N
135	pallet	6300	\N	2026-03-24 12:29:19.328	2026-03-24 12:29:19.328	29	\N	1
136	pallet	7350	\N	2026-03-24 12:29:28.208	2026-03-24 12:29:28.208	29	\N	2
137	pallet	8400	\N	2026-03-24 12:29:34.7	2026-03-24 12:29:34.7	29	\N	3
138	boxes	750	\N	2026-03-24 12:29:49.115	2026-03-24 12:29:49.115	29	1	\N
139	boxes	850	\N	2026-03-24 12:29:53.729	2026-03-24 12:29:53.729	29	2	\N
140	boxes	950	\N	2026-03-24 12:29:59.498	2026-03-24 12:29:59.498	29	3	\N
141	boxes	4750	\N	2026-03-24 12:30:06.623	2026-03-24 12:30:06.623	29	83	\N
142	pallet	6300	\N	2026-03-24 12:30:19.218	2026-03-24 12:30:19.218	28	\N	1
143	pallet	7350	\N	2026-03-24 12:30:26.313	2026-03-24 12:30:26.313	28	\N	2
144	pallet	8400	\N	2026-03-24 12:30:31.969	2026-03-24 12:30:31.969	28	\N	3
145	boxes	750	\N	2026-03-24 12:30:38.331	2026-03-24 12:30:38.331	28	1	\N
146	boxes	850	\N	2026-03-24 12:30:43.516	2026-03-24 12:30:43.516	28	2	\N
147	boxes	950	\N	2026-03-24 12:30:48.7	2026-03-24 12:30:48.7	28	3	\N
148	pallet	6300	\N	2026-03-24 12:31:29.944	2026-03-24 12:31:29.944	31	\N	1
149	pallet	7350	\N	2026-03-24 12:31:45.386	2026-03-24 12:31:45.386	31	\N	2
150	pallet	8400	\N	2026-03-24 12:31:51.419	2026-03-24 12:31:51.419	31	\N	3
151	boxes	750	\N	2026-03-24 12:32:01.745	2026-03-24 12:32:01.745	31	1	\N
152	boxes	850	\N	2026-03-24 12:32:06.86	2026-03-24 12:32:06.86	31	2	\N
153	boxes	950	\N	2026-03-24 12:32:12.079	2026-03-24 12:32:12.079	31	3	\N
154	boxes	4750	\N	2026-03-24 12:32:18.838	2026-03-24 12:32:18.838	31	83	\N
155	pallet	6300	\N	2026-03-24 12:32:30.119	2026-03-24 12:32:30.119	32	\N	1
156	pallet	7350	\N	2026-03-24 12:32:40.187	2026-03-24 12:32:40.187	32	\N	2
157	pallet	8400	\N	2026-03-24 12:32:47.497	2026-03-24 12:32:47.497	32	\N	3
158	boxes	750	\N	2026-03-24 12:32:53.916	2026-03-24 12:32:53.916	32	1	\N
159	boxes	850	\N	2026-03-24 12:32:58.81	2026-03-24 12:32:58.81	32	2	\N
160	boxes	950	\N	2026-03-24 12:33:05.417	2026-03-24 12:33:05.417	32	3	\N
161	boxes	4750	\N	2026-03-24 12:33:11.682	2026-03-24 12:33:11.682	32	83	\N
\.


--
-- Data for Name: prices_fbs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prices_fbs (id, destination, volume, price, comment, created_at) FROM stdin;
1	WB Курск FBS	0.1	200 руб.	0,1 куб/м	2026-03-15 18:44:15.474
\.


--
-- Data for Name: request_field_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_field_history (id, request_id, manager_id, field, old_value, new_value, changed_at) FROM stdin;
74	217	1	boxCount	4	3	2026-03-16 19:10:16.089
75	368	1	deliveryDate	2026-03-26T00:00:00.000Z	2026-03-24T00:00:00.000Z	2026-03-23 15:09:20.348
76	368	1	deliveryDate	2026-03-24T00:00:00.000Z	2026-03-26T00:00:00.000Z	2026-03-23 15:09:29.837
77	369	1	deliveryDate	2026-03-26T00:00:00.000Z	2026-03-24T00:00:00.000Z	2026-03-23 15:09:38.326
78	369	2	deliveryDate	2026-03-24T00:00:00.000Z	2026-03-23T00:00:00.000Z	2026-03-24 04:13:42.633
79	417	2	deliveryDate	2026-03-25T00:00:00.000Z	2026-03-24T00:00:00.000Z	2026-03-25 09:39:46.695
80	519	1	volume	6	1	2026-03-28 14:56:37.053
81	520	1	volume	0.55	15	2026-03-28 14:56:53.128
82	522	1	volume	5	0.1	2026-03-28 15:15:39.37
83	526	1	volume	0.3	0.5	2026-03-29 16:25:17.23
84	526	1	volume	0.5	0.7	2026-03-29 16:25:32.725
85	614	1	packagingType	boxes	pallets	2026-03-31 08:08:26.871
86	614	1	boxCount	1	1	2026-03-31 08:08:29.604
87	614	1	boxCount	1	5	2026-03-31 08:08:33.56
88	640	1	volume	0.1	0.2	2026-04-01 10:19:56.474
89	710	2	volume	0.08	0.1	2026-04-06 09:07:30.63
90	747	1	boxCount	1	6	2026-04-06 09:25:32.578
91	733	1	boxCount	1	1	2026-04-06 10:22:19.205
92	732	1	boxCount	1	1	2026-04-06 10:22:52.123
93	731	1	boxCount	1	1	2026-04-06 10:23:38.362
94	755	1	boxCount	6	1	2026-04-06 10:37:10.887
95	755	1	boxCount	1	6	2026-04-06 10:37:52.594
96	764	1	boxCount	2	1	2026-04-06 12:05:49.002
97	794	1	volume	0.05	0.1	2026-04-07 13:31:40.617
98	768	1	volume	0.9	0.15	2026-04-09 06:08:10.679
99	869	2	deliveryDate	2026-04-09T12:00:00.000Z	2026-04-08T00:00:00.000Z	2026-04-09 09:26:27.614
100	739	2	deliveryDate	2026-04-15T00:00:00.000Z	2026-04-12T00:00:00.000Z	2026-04-09 10:45:40.76
101	723	2	deliveryDate	2026-04-17T00:00:00.000Z	2026-04-10T00:00:00.000Z	2026-04-09 10:56:11.669
102	723	2	boxCount	12	1	2026-04-09 11:42:50.239
103	749	2	volume	0.15	1	2026-04-09 13:46:39.065
\.


--
-- Data for Name: request_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_photos (id, request_id, file_id, file_url, uploaded_at, uploaded_by) FROM stdin;
1	500	AgACAgIAAxkBAAIKDmnHmngiR8NUPWJ7uR54hIjPY3RXAAIzEmsbhoNASlo7jias5ePFAQADAgADeQADOgQ	\N	2026-03-28 09:08:08.771	918858687
5	501	AgACAgIAAxkBAAIKHGnHqO7PzSfIo80g1GJP8dAMYN0qAAMTaxuGg0BKfz1lj4URnvABAAMCAAN5AAM6BA	\N	2026-03-28 10:09:50.924	918858687
6	509	AgACAgIAAxkBAAIKQmnH3y8-WAuwaQcDmvB192-V789xAALhFGsbJilBSr1TE4Z-xhdRAQADAgADeQADOgQ	\N	2026-03-28 14:01:19.593	918858687
7	510	AgACAgIAAxkBAAIKT2nH4AABrwSSi7L7rbYoK715LrhyYwACSSlrGxP9QUrDd_g2zuemWgEAAwIAA3kAAzoE	\N	2026-03-28 14:04:48.075	497135054
8	522	AgACAgIAAxkBAAIKpWnICc8lOBWt5xc8c0Cnb3Z773pQAAIhGWsbf0FASoPUgOjbYT1UAQADAgADeQADOgQ	\N	2026-03-28 17:03:11.17	638740448
9	523	AgACAgIAAxkBAAIKsGnI50WjYD6MLBMhx_ITYe_53DS6AAKCFGsbJilJStFh6Yt5B6eNAQADAgADeQADOgQ	\N	2026-03-29 08:48:06.083	918858687
10	523	AgACAgIAAxkBAAIKsmnI50WHr-DsanWdMREbSBDUXZdnAAK6FWsbdPg5Soy6zTUk7d7PAQADAgADeQADOgQ	\N	2026-03-29 08:50:43.134	918858687
11	523	AgACAgIAAxkBAAIKsWnI50Vi_4Pg04-9myhCESgEtEoOAAK7FWsbdPg5Si3B3nJFQ-qoAQADAgADeQADOgQ	\N	2026-03-29 08:50:43.219	918858687
12	523	AgACAgIAAxkBAAIKEmnHnAo7kv2rRhRHTPiT9a_haZ9nAAK9EmsbhoNASu51wzbjU4uwAQADAgADeQADOgQ	\N	2026-03-29 08:50:43.31	918858687
13	523	AgACAgIAAxkBAAIKsmnI50WHr-DsanWdMREbSBDUXZdnAAK6FWsbdPg5Soy6zTUk7d7PAQADAgADeQADOgQ	\N	2026-03-29 08:52:15.252	918858687
14	523	AgACAgIAAxkBAAIKsWnI50Vi_4Pg04-9myhCESgEtEoOAAK7FWsbdPg5Si3B3nJFQ-qoAQADAgADeQADOgQ	\N	2026-03-29 08:52:15.373	918858687
15	523	AgACAgIAAxkBAAIKEmnHnAo7kv2rRhRHTPiT9a_haZ9nAAK9EmsbhoNASu51wzbjU4uwAQADAgADeQADOgQ	\N	2026-03-29 08:52:15.447	918858687
16	522	AgACAgIAAxkBAAIKsmnI50WHr-DsanWdMREbSBDUXZdnAAK6FWsbdPg5Soy6zTUk7d7PAQADAgADeQADOgQ	\N	2026-03-29 08:55:12.813	918858687
17	522	AgACAgIAAxkBAAIKsWnI50Vi_4Pg04-9myhCESgEtEoOAAK7FWsbdPg5Si3B3nJFQ-qoAQADAgADeQADOgQ	\N	2026-03-29 08:55:12.886	918858687
18	522	AgACAgIAAxkBAAIKEmnHnAo7kv2rRhRHTPiT9a_haZ9nAAK9EmsbhoNASu51wzbjU4uwAQADAgADeQADOgQ	\N	2026-03-29 08:55:12.964	918858687
19	522	AgACAgIAAxkBAAIKsmnI50WHr-DsanWdMREbSBDUXZdnAAK6FWsbdPg5Soy6zTUk7d7PAQADAgADeQADOgQ	\N	2026-03-29 08:58:21.3	918858687
20	522	AgACAgIAAxkBAAIKsWnI50Vi_4Pg04-9myhCESgEtEoOAAK7FWsbdPg5Si3B3nJFQ-qoAQADAgADeQADOgQ	\N	2026-03-29 08:58:21.369	918858687
21	522	AgACAgIAAxkBAAIKEmnHnAo7kv2rRhRHTPiT9a_haZ9nAAK9EmsbhoNASu51wzbjU4uwAQADAgADeQADOgQ	\N	2026-03-29 08:58:21.437	918858687
22	526	AgACAgIAAxkBAAIKpWnICc8lOBWt5xc8c0Cnb3Z773pQAAIhGWsbf0FASoPUgOjbYT1UAQADAgADeQADOgQ	\N	2026-03-29 10:47:18.163	638740448
23	526	AgACAgIAAxkBAAIK4GnJA6s6L4HS6cCT0P-EggWk9YFoAAJ7FWsbE_1JSiCC-aRgCiq_AQADAgADeQADOgQ	\N	2026-03-29 10:49:16.049	497135054
24	526	AgACAgIAAxkBAAIK4WnJA7UXIoT2EMj2k8Buyheu6tMZAAJ8FWsbE_1JSqGsnVfRztz-AQADAgADeQADOgQ	\N	2026-03-29 10:49:25.34	497135054
25	529	AgACAgIAAxkBAAIK9WnJU8p-BHX0hNdGE6fQ4vTCbesPAALQEGsbf0FQSkdkVf43SeP4AQADAgADeQADOgQ	\N	2026-03-29 16:31:06.367	638740448
26	544	AgACAgIAAxkBAAILeWnKH7ezTcceOHUMfTBJP371C66lAAJ7GGsbJEdQSoWOHZAsAgE9AQADAgADeQADOgQ	\N	2026-03-30 07:01:11.235	638740448
27	579	AgACAgIAAxkBAAIMJmnKjCP0I7CwzYGoDdP_xd-mi0bWAAKrGGsbggFQSrx7PmIjewisAQADAgADeQADOgQ	\N	2026-03-30 14:43:47.718	1074888055
28	619	AgACAgIAAxkBAAINOmnMsyreuJnpCVFE4nspTgNg1OoyAAKfE2sbDcNpSmLOyzaxR7f4AQADAgADeQADOgQ	\N	2026-04-01 05:54:50.91	638740448
29	639	AgACAgIAAxkBAAIN02nM797JkO1hptIU3jMmu-ZuDQg6AAJhHmsbnWNpSlPQOx9Fxf9bAQADAgADeQADOgQ	\N	2026-04-01 10:13:50.989	1074888055
\.


--
-- Data for Name: request_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_services (id, request_id, description, unit, quantity, price, amount, created_at) FROM stdin;
219	173	Транспортные услуги по маршруту г. Белгород - г. Курск	паллет	50	5000	250000	2026-03-16 15:30:52.307
220	176	Транспортные услуги по маршруту г. Белгород - г. Курск	паллет	564	5000	2820000	2026-03-16 15:31:10.136
182	188	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	кор	7	0	0	2026-03-14 20:11:12.06
643	529	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-29 16:30:16.154
197	202	WB Курск FBS FBS — 0.1	м³	0.6	2000	1200	2026-03-16 09:39:23.414
186	192	WB Курск FBS FBS — 0.1	м³	100	2000	200000	2026-03-15 18:53:32.12
177	184	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	кор	1	500	500	2026-03-13 19:08:13.29
157	169	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Маленькая	кор	1	5000	5000	2026-03-13 06:32:05.901
187	193	WB Курск FBS FBS — 0.1	м³	0.3	2000	600	2026-03-15 19:06:26.259
188	194	WB Курск FBS FBS — 0.1	м³	150	2000	300000	2026-03-15 19:23:59.18
660	480	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	шт	1	2700	2700	2026-03-30 06:37:09.06
689	560	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-30 08:02:23.684
705	574	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	кор	2	990	1980	2026-03-30 11:29:50.117
153	165	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	3	750	2250	2026-03-12 12:15:39.756
154	166	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — 301–400	пал	5	6000	30000	2026-03-12 13:08:47.997
155	167	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Большая	кор	1	850	850	2026-03-12 14:31:08.953
156	168	Транспортные услуги по маршруту г. Белгород - г. Казань Палета — 301–400	пал	1	5000	5000	2026-03-12 15:10:01.366
162	174	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	6	650	3900	2026-03-13 14:07:41.564
163	175	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — 301–400	пал	7	6000	42000	2026-03-13 14:11:18.48
164	176	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — от 0 кг до 300 кг	пал	4	5000	20000	2026-03-13 14:12:08.733
165	176	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Коробка	кор	556	0	0	2026-03-13 14:12:08.733
166	176	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	4	650	2600	2026-03-13 14:12:08.733
168	178	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	5	650	3250	2026-03-13 14:23:08.652
169	179	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — 301–400	пал	5	6000	30000	2026-03-13 15:06:19.449
170	179	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — 301–400	пал	6	6000	36000	2026-03-13 15:06:19.449
171	180	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	1	0	0	2026-03-13 15:24:32.306
172	180	Транспортные услуги по маршруту г. Белгород - г. Волгоград Палета — 301–400	пал	1	0	0	2026-03-13 15:24:32.306
173	181	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	5	750	3750	2026-03-13 15:25:27.713
174	182	Транспортные услуги по маршруту г. Белгород - г. Курск Палета — от 0 кг до 300 кг	пал	4	5000	20000	2026-03-13 15:44:02.276
175	182	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Большая	кор	4	850	3400	2026-03-13 15:44:02.276
176	183	Транспортные услуги по маршруту г. Белгород - г. Волгоград Палета — 301–400	пал	1	0	0	2026-03-13 18:21:09.515
179	185	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	кор	1	0	0	2026-03-13 19:25:57.299
181	187	Транспортные услуги по маршруту г. Белгород - г. Казань Палета — 301–400	пал	1	0	0	2026-03-14 11:03:41.458
178	184	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	1	12500	12500	2026-03-13 19:08:13.29
183	189	Транспортные услуги по маршруту г. Белгород - г. Волгоград Палета — 301–400	пал	2	0	0	2026-03-15 16:41:53.339
185	191	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	1	750	750	2026-03-15 16:52:06.386
184	190	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	2	0	0	2026-03-15 16:42:00.704
195	200	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	4	890	3560	2026-03-16 09:09:59.314
221	165	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Средняя	шт	1	750	750	2026-03-16 16:27:13.084
223	217	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	4	750	3000	2026-03-16 16:54:56.4
224	218	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Средняя	кор	2	890	1780	2026-03-16 16:57:35.972
229	217	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Маленькая	шт	1	650	650	2026-03-16 19:12:55.309
230	217	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Большая	шт	1	850	850	2026-03-16 19:12:59.43
231	217	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  от 5 до 10 коробок	шт	1	4300	4300	2026-03-16 19:13:03.047
232	217	Транспортные услуги по маршруту г. Белгород - г. Курск - Маленькая	коробка	3	650	1950	2026-03-16 19:13:07.097
228	217	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Маленькая	шт	1	650	650	2026-03-16 19:12:51.681
661	539	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	пал	1	7900	7900	2026-03-30 06:43:27.719
240	227	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	кор	1	990	990	2026-03-17 10:50:16.698
242	228	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-03-17 11:42:21.054
244	230	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	1	850	850	2026-03-17 12:00:58.053
246	232	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	1	850	850	2026-03-17 14:11:47.129
662	540	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	пал	1	7900	7900	2026-03-30 06:46:13.315
256	242	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	5	650	3250	2026-03-18 08:33:32.704
690	561	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-30 08:32:13.112
259	207	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	шт	1	4500	4500	2026-03-18 08:40:47.298
261	198	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Средняя	шт	1	890	890	2026-03-18 08:44:28.477
752	608	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-03-31 08:02:19.84
720	587	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-30 12:59:45.474
266	250	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	1	650	650	2026-03-18 09:10:37.69
280	264	Транспортные услуги по маршруту ФБС г. Белгород - г. Курск	коробка	1	840	840	2026-03-18 15:10:50.675
733	597	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	кор	1	7500	7500	2026-03-31 07:26:03.454
774	617	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-03-31 09:05:11.82
785	625	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	кор	1	800	800	2026-03-31 11:52:56.929
788	627	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-31 11:54:41.199
800	576	Паллетирование	руб.	1	275	275	2026-04-01 08:29:59.488
664	540	Помощь на выгрузке	руб.	1	200	200	2026-03-30 06:46:13.315
839	600	Помощь на выгрузке	шт	1	10	10	2026-04-01 12:41:39.116
341	307	Паллетирование	руб.	1	250	250	2026-03-19 18:09:50.314
845	599	Помощь на выгрузке	рублей	3	10	30	2026-04-01 13:07:11.127
289	274	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-03-18 18:23:54.754
305	291	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	900	2700	2026-03-19 09:08:17.182
307	293	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-03-19 09:44:37.782
303	288	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	1	5300	5300	2026-03-19 08:40:46.548
316	297	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1200	1200	2026-03-19 12:06:48.379
318	297	Помощь на выгрузке	рублей	15	10	150	2026-03-19 12:20:01.877
278	262	Доставка ФБС Курск	коробка	1	200	200	2026-03-18 13:39:25.434
364	293	Паллетирование	руб.	1	275	275	2026-03-20 13:40:29.032
365	293	Предоставление деревянного поддона	руб.	1	375	375	2026-03-20 13:40:36.701
238	225	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-17 08:42:06.048
203	206	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	кор	2	1100	2200	2026-03-16 11:02:33.672
205	208	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — от 5 до 10 коробок	кор	1	4500	4500	2026-03-16 11:44:01.656
206	209	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	кор	1	5500	5500	2026-03-16 11:45:30.58
801	576	Предоставление деревянного поддона	руб.	1	375	375	2026-04-01 08:30:02.573
665	541	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-30 06:51:38.059
212	205	Коробки — от 5 до 10 коробок, WB Екатеринбург	шт	1	7500	7500	2026-03-16 13:50:41.536
267	251	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	кор	3	950	2850	2026-03-18 09:55:33.95
691	562	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	1	990	990	2026-03-30 08:33:30.977
721	588	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Маленькая	кор	1	790	790	2026-03-30 13:01:51.59
218	173	Транспортные услуги по маршруту г. Белгород - г. Курск Палета - от 0 кг до 300 кг	шт	1	5000	5000	2026-03-16 14:57:54.902
272	256	тест Коробка — Большая	кор	1	10	10	2026-03-18 11:15:14.011
222	216	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	кор	110000	850	93500000	2026-03-16 16:36:44.773
735	575	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	шт	4	1200	4800	2026-03-31 07:29:30.353
213	215	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-16 14:32:36.759
736	575	Гофрокартон 60х40х40 	руб.	8	120	960	2026-03-31 07:30:35.733
816	634	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Большая	шт	1	990	990	2026-04-01 10:10:09.002
239	226	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-03-17 08:48:38.629
738	575	Упаковка товара	ед	1150	11	12650	2026-03-31 07:31:22.899
754	610	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Маленькая	кор	2	750	1500	2026-03-31 08:05:07.776
755	611	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-31 08:05:24.044
776	619	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	20	2026-03-31 09:19:38.474
247	233	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Средняя	кор	5	940	4700	2026-03-17 16:42:12.063
787	626	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	кор	1	850	850	2026-03-31 11:53:40.116
820	640	Гофрокартон 60х40х40 (б/у 5ти слойные)	шт	1	60	60	2026-04-01 10:18:08.22
251	237	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Средняя	шт	3	750	2250	2026-03-18 08:15:36.498
253	239	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	5	750	3750	2026-03-18 08:24:31.814
822	640	Помощь на выгрузке	шт	1	10	10	2026-04-01 10:19:40.786
825	640	Помощь на выгрузке	шт	1	10	10	2026-04-01 10:21:03.306
273	257	тест Коробка — Маленькая	кор	1	10	10	2026-03-18 11:29:37.515
832	553	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	шт	1	1200	1200	2026-04-01 12:21:29.817
666	542	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Большая	кор	1	1140	1140	2026-03-30 06:52:22.391
840	645	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.42	200	840	2026-04-01 12:57:51.694
843	577	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	шт	4	900	3600	2026-04-01 13:01:52.976
846	601	Помощь на выгрузке	рублей	3	10	30	2026-04-01 13:08:00.455
848	557	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Большая	шт	2	990	1980	2026-04-01 13:10:58.954
849	646	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-04-01 14:55:36.994
306	292	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	3	900	2700	2026-03-19 09:42:02.488
311	186	Выгрузка/Cборка	рублей	1	200	200	2026-03-19 09:54:04.128
312	186	Транспортные услуги по маршруту г. Белгород - г. Волгоград - Коробка  Маленькая	шт	1	790	790	2026-03-19 09:54:15.829
262	246	WB Курск FBS FBS — 0.1	м³	2	2000	4000	2026-03-18 08:44:32.255
317	297	Паллетирование	руб.	1	250	250	2026-03-19 12:19:54.266
263	247	WB Курск FBS FBS — 0.1	м³	6	2000	12000	2026-03-18 08:50:25.835
265	249	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 09:08:16.321
789	628	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Средняя	кор	1	890	890	2026-03-31 11:55:17.824
802	559	Гофрокартон 60х40х40 (б/у 5ти слойные)	руб.	20	60	1200	2026-04-01 08:33:13.134
355	315	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	4	990	3960	2026-03-20 08:46:57.868
356	298	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  от 5 до 10 коробок	шт	1	5250	5250	2026-03-20 08:53:19.522
325	235	Забор груза с адреса до 12 коробок или до (1 м³)	руб	1	500	500	2026-03-19 13:22:22.884
326	202	Забор груза с адреса до 12 коробок или до (1 м³)	руб	1	500	500	2026-03-19 13:23:14.954
803	548	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Большая	шт	4	990	3960	2026-04-01 08:35:45.671
324	283	Забор груза с адреса до 12 коробок или до (1 м³)	руб	1	500	500	2026-03-19 13:15:41.194
327	283	Транспортные услуги по доставке ФБС г. Белгород - г. Курск 	шт	1	1600	1600	2026-03-19 13:27:54.789
672	545	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-30 07:01:56.005
722	589	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.7	200	1400	2026-03-30 13:22:37.405
330	304	Помощь на выгрузке	руб.	1	10	10	2026-03-19 14:05:23.343
331	304	Забор груза с адреса	руб.	1	500	500	2026-03-19 14:05:23.343
811	635	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-01 09:20:37.118
333	305	Забор груза с адреса	руб.	1	500	500	2026-03-19 14:13:03.241
334	305	Помощь на выгрузке	руб.	1	10	10	2026-03-19 14:13:03.241
737	575	Распечатка (шк коробов или поставки)	руб.	1	50	50	2026-03-31 07:31:00.986
668	543	Помощь на выгрузке	руб.	1	200	200	2026-03-30 06:59:22.85
336	306	Забор груза с адреса	руб.	1	500	500	2026-03-19 14:31:01.904
337	306	Помощь на выгрузке	руб.	1	10	10	2026-03-19 14:31:01.904
667	543	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 301 кг до 400 кг	пал	1	8900	8900	2026-03-30 06:59:22.85
339	307	Забор груза с адреса	руб.	1	500	500	2026-03-19 15:38:23.353
340	307	Помощь на выгрузке	руб.	1	10	10	2026-03-19 15:38:23.353
342	300	Транспортные услуги по маршруту г. Белгород - г. Тула - Палета  от 0 кг до 300 кг	шт	2	5300	10600	2026-03-20 07:05:38.281
358	317	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	1	890	890	2026-03-20 09:53:04.317
359	318	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	4	900	3600	2026-03-20 10:20:57.591
343	300	Паллетирование	руб.	2	275	550	2026-03-20 07:05:56.085
344	300	Предоставление деревянного поддона	руб.	2	375	750	2026-03-20 07:06:04.702
756	612	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Палета — от 401 кг до 500 кг	пал	1	14000	14000	2026-03-31 08:05:31.059
346	308	Забор груза с адреса	руб.	1	500	500	2026-03-20 07:19:29.343
817	556	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Большая	шт	2	900	1800	2026-04-01 10:11:30.436
777	620	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-31 09:25:14.111
349	310	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-03-20 08:02:12.072
778	618	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-31 09:25:27.737
821	640	Гофрокартон 60х40х40 (б/у 5ти слойные)	шт	1	60	60	2026-04-01 10:19:16.81
823	640	Помощь на выгрузке	шт	1	10	10	2026-04-01 10:20:12.714
824	640	Гофрокартон 60х40х40 (б/у 5ти слойные)	шт	1	60	60	2026-04-01 10:20:57.653
366	293	Забор груза с адреса до 80 коробов (8 м³)	руб.	1	1350	1350	2026-03-20 13:41:00.944
367	293	Помощь на выгрузке	рублей	36	10	360	2026-03-20 13:41:07.576
830	643	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	шт	1	5500	5500	2026-04-01 11:39:08.692
371	325	Забор груза с адреса	руб.	1	500	500	2026-03-21 05:25:51.66
841	549	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	шт	2	900	1800	2026-04-01 12:59:20.52
842	558	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	шт	1	900	900	2026-04-01 13:01:11.475
844	527	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	шт	4	900	3600	2026-04-01 13:04:15.89
692	563	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-03-30 08:47:52.142
847	602	Помощь на выгрузке	рублей	3	10	30	2026-04-01 13:08:11.842
647	526	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-29 16:43:43.727
669	544	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-30 07:00:02.408
670	544	Забор груза с адреса	руб.	1	500	500	2026-03-30 07:00:02.408
671	544	Помощь на выгрузке	руб.	1	10	10	2026-03-30 07:00:02.408
381	334	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	кор	1	990	990	2026-03-21 14:02:09.467
382	335	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-03-21 14:03:12.265
383	336	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	кор	1	1100	1100	2026-03-21 20:41:10.143
384	336	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1200	1200	2026-03-21 20:41:10.143
385	337	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	2	850	1700	2026-03-22 09:19:29.459
386	337	Помощь на выгрузке	руб.	2	10	20	2026-03-22 09:19:29.459
693	564	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-30 09:27:55.376
388	338	Забор груза с адреса	руб.	1	500	500	2026-03-22 09:33:50.384
389	338	Помощь на выгрузке	руб.	19	10	190	2026-03-22 09:33:50.384
391	339	Забор груза с адреса	руб.	1	500	500	2026-03-22 10:24:36.08
392	339	Помощь на выгрузке	руб.	4	10	40	2026-03-22 10:24:36.08
393	340	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	2	890	1780	2026-03-22 12:11:27.805
394	341	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Маленькая	кор	1	840	840	2026-03-22 12:51:21.285
710	577	Помощь на выгрузке	руб.	4	10	40	2026-03-30 11:41:14.717
396	342	Помощь на выгрузке	руб.	4	10	40	2026-03-22 14:40:38.932
723	590	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-30 13:24:59.618
398	344	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	кор	1	990	990	2026-03-23 05:02:02.101
399	345	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-03-23 05:02:55.304
401	347	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Средняя	шт	1	890	890	2026-03-23 06:14:45.262
402	348	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	кор	1	850	850	2026-03-23 06:22:46.382
403	349	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-23 06:23:54.835
404	350	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-23 07:36:19.405
405	351	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	1	890	890	2026-03-23 07:38:44.027
406	352	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	кор	1	850	850	2026-03-23 07:39:04.484
407	353	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	1	890	890	2026-03-23 07:39:24.895
739	599	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	200	600	2026-03-31 07:35:52.929
411	356	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	1	890	890	2026-03-23 08:12:06.052
412	357	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	2	900	1800	2026-03-23 09:26:29.773
413	358	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	кор	3	800	2400	2026-03-23 09:26:46.629
741	601	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	200	600	2026-03-31 07:36:48.661
758	613	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-31 08:07:11.848
779	621	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-31 09:55:19.088
790	629	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	1	750	750	2026-03-31 11:55:58.227
400	346	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1300	1300	2026-03-23 05:03:19.111
410	355	Помощь на выгрузке	руб.	32	10	320	2026-03-23 07:52:40.872
409	355	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Палета — от 301 кг до 400 кг	пал	2	9300	18600	2026-03-23 07:52:40.872
376	329	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-21 10:26:21.75
377	330	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2000	4000	2026-03-21 11:01:15.748
648	530	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	200	6000	2026-03-29 16:51:34.877
674	546	Забор груза с адреса	руб.	1	1350	1350	2026-03-30 07:08:00.136
694	565	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-30 09:34:02.682
425	370	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Маленькая	кор	2	700	1400	2026-03-23 13:21:15.433
426	371	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-03-23 13:22:01.658
427	372	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Маленькая	кор	1	1000	1000	2026-03-23 13:22:35.809
711	578	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-30 12:09:46.075
431	375	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Маленькая	кор	1	650	650	2026-03-23 13:42:26.914
724	591	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	2	1040	2080	2026-03-30 16:54:53.748
433	376	Помощь на выгрузке	руб.	7	10	70	2026-03-23 14:25:43.077
434	377	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	4	990	3960	2026-03-23 14:26:50.33
435	377	Помощь на выгрузке	руб.	4	10	40	2026-03-23 14:26:50.33
436	378	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	3	1040	3120	2026-03-23 14:27:50.812
437	378	Помощь на выгрузке	руб.	3	10	30	2026-03-23 14:27:50.812
438	379	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	3	1200	3600	2026-03-23 14:29:02.021
439	379	Помощь на выгрузке	руб.	3	10	30	2026-03-23 14:29:02.021
440	380	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	3	1040	3120	2026-03-23 15:53:40.729
725	591	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-30 16:54:53.748
442	382	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	кор	1	990	990	2026-03-23 17:19:14.352
759	605	Транспортные услуги по маршруту г. Белгород - г. Воронеж - Коробка  Средняя	шт	2	750	1500	2026-03-31 08:07:26.534
673	546	Транспортные услуги по маршруту г. Белгород - г. Тула Палета 	пал	1	8450	8450	2026-03-30 07:08:00.136
445	384	Забор груза с адреса до 12 коробок или до (1 м³)	руб	1	500	500	2026-03-23 17:46:26.5
740	600	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-03-31 07:36:31.919
765	614	Помощь на выгрузке от 0.6м³до 1м³	шт	1	100	100	2026-03-31 08:09:00.146
675	547	Транспортные услуги по маршруту г. Белгород - г. Рязань Палета 	пал	1	9450	9450	2026-03-30 07:12:02.618
448	387	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-23 18:30:13.853
449	388	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Маленькая	кор	3	840	2520	2026-03-23 19:39:02.531
450	389	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	кор	1	5500	5500	2026-03-23 19:41:30.52
451	390	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-03-23 19:42:26.678
452	391	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Маленькая	кор	2	650	1300	2026-03-23 19:59:14.725
742	602	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	200	600	2026-03-31 07:36:59.735
454	392	Забор груза с адреса	руб.	1	500	500	2026-03-23 20:08:44.166
766	606	Выгрузка/Cборка	рублей	1	200	200	2026-03-31 08:09:00.918
780	614	Гофрокартон 60х40х40 (б/у 5ти слойные)	шт	1	60	60	2026-03-31 10:04:39.088
791	630	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.46	200	920	2026-03-31 12:29:23.041
804	534	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Средняя	шт	1	940	940	2026-04-01 08:48:43.518
806	555	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	1	1040	1040	2026-04-01 08:49:54.285
812	636	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-01 09:22:23.463
429	373	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	пал	1	7900	7900	2026-03-23 13:23:26.601
418	363	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-23 10:57:08.836
430	374	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Маленькая	кор	2	840	1680	2026-03-23 13:24:09.198
419	364	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-23 11:30:12.38
461	398	Забор груза с адреса	руб.	1	500	500	2026-03-24 05:01:03.908
462	398	Помощь на выгрузке	руб.	1.5	10	15	2026-03-24 05:01:03.908
463	399	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	кор	1	7500	7500	2026-03-24 06:21:33.4
464	400	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	кор	3	850	2550	2026-03-24 06:55:01.582
466	401	Забор груза с адреса	руб.	1	500	500	2026-03-24 06:59:25.703
649	531	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	2	990	1980	2026-03-29 19:16:21.499
677	548	Помощь на выгрузке	руб.	4	10	40	2026-03-30 07:36:57.824
695	566	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-30 09:35:12.353
696	567	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.14	2000	280	2026-03-30 09:36:15.929
472	407	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	шт	1	7540	7540	2026-03-24 12:05:32.928
712	579	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.26	200	520	2026-03-30 12:11:38.312
475	410	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-03-24 14:08:05.502
726	592	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-03-30 19:23:15.413
477	412	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-03-24 19:52:18.693
478	294	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Палета  от 401 кг до 500 кг	шт	1	7312	7312	2026-03-25 07:11:16.462
479	413	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	2	990	1980	2026-03-25 07:13:22.172
743	543	Паллетирование	руб.	1	275	275	2026-03-31 07:45:20.511
483	416	Забор груза с адреса	руб.	1	500	500	2026-03-25 08:00:40.548
484	343	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  от 5 до 10 коробок	шт	1	4500	4500	2026-03-25 09:20:25.042
485	354	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Средняя	шт	1	1100	1100	2026-03-25 09:24:56.643
744	543	Предоставление деревянного поддона	руб.	1	375	375	2026-03-31 07:45:24.701
465	401	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-03-24 06:59:25.703
482	416	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-03-25 08:00:40.548
760	614	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Маленькая	кор	1	700	700	2026-03-31 08:08:15.468
460	398	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-03-24 05:01:03.908
467	402	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-24 07:07:06.9
468	403	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-24 07:51:09.322
469	404	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-24 09:04:53.339
470	405	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-24 11:28:26.949
471	406	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-24 11:53:09.633
473	408	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-24 12:43:07.477
761	606	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Палета  от 0 кг до 300 кг	шт	1	8300	8300	2026-03-31 08:08:40.92
762	606	Паллетирование	руб.	1	275	275	2026-03-31 08:08:49.822
763	606	Предоставление деревянного поддона	руб.	1	375	375	2026-03-31 08:08:57.016
764	614	Помощь на выгрузке	шт	1	10	10	2026-03-31 08:08:57.567
767	614	Помощь на выгрузке	шт	1	10	10	2026-03-31 08:09:02.568
781	622	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-31 10:26:09.188
792	631	Транспортные услуги по маршруту г. Белгород - г. Воронеж (ОZON с. Александровка) Палета — Палета	пал	4	0	0	2026-03-31 14:00:44.809
679	550	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-30 07:47:27.929
805	550	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	1	1040	1040	2026-04-01 08:49:25.184
813	636	Помощь на выгрузке	руб.	1	10	10	2026-04-01 09:22:23.463
818	639	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-01 10:13:21.982
826	609	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	шт	1	940	940	2026-04-01 10:53:02.672
727	592	Помощь на выгрузке	руб.	10	10	100	2026-03-30 19:23:15.413
650	532	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-29 19:17:11.83
486	355	Паллетирование	руб.	2	275	550	2026-03-25 09:26:04.684
487	355	Предоставление деревянного поддона	руб.	2	375	750	2026-03-25 09:26:15.461
491	420	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-03-25 09:59:54.987
493	422	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	1	890	890	2026-03-25 10:03:53.041
494	423	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-03-25 10:04:36.741
697	568	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	1	5300	5300	2026-03-30 09:45:09.61
496	373	Паллетирование	руб.	1	275	275	2026-03-25 10:13:38.954
497	373	Предоставление деревянного поддона	руб.	1	375	375	2026-03-25 10:13:42.435
498	373	Помощь на выгрузке	шт	36	10	360	2026-03-25 10:14:17.172
499	374	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	1	1040	1040	2026-03-25 10:15:09.189
500	376	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	шт	1	4500	4500	2026-03-25 10:18:41.008
501	425	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-03-25 10:25:13.036
698	568	Забор груза с адреса	руб.	1	1350	1350	2026-03-30 09:45:09.61
503	427	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	кор	1	5500	5500	2026-03-25 10:27:12.777
521	439	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	1	990	990	2026-03-25 14:13:02.076
522	440	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-25 14:14:03.868
504	421	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	шт	1	940	940	2026-03-25 10:29:44.012
506	369	Гофрокартон 60х40х40 (б/у 5ти слойные)	руб.	26	60	1560	2026-03-25 10:37:52.854
507	428	Гофрокартон 60х40х40 (б/у 5ти слойные)	руб.	26	60	1560	2026-03-25 10:39:04.44
508	429	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-03-25 10:40:58.66
713	580	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	2	900	1800	2026-03-30 12:24:30.553
728	593	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-03-30 19:48:54.34
509	429	Помощь на выгрузке	руб.	30	10	300	2026-03-25 10:40:58.66
511	429	Паллетирование	руб.	2	275	550	2026-03-25 10:48:48.163
512	429	Предоставление деревянного поддона	руб.	2	375	750	2026-03-25 10:48:56.047
513	431	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-03-25 10:54:07.552
514	432	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-25 10:54:41.276
745	539	Паллетирование	руб.	1	275	275	2026-03-31 07:48:56.595
516	434	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	2	890	1780	2026-03-25 11:39:05.891
746	603	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-31 07:49:22.723
768	614	Помощь на выгрузке	шт	1	10	10	2026-03-31 08:14:56.65
524	442	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Маленькая	шт	5	650	3250	2026-03-25 17:24:43.365
526	443	Забор груза с адреса	руб.	1	500	500	2026-03-26 06:35:54.487
528	444	Забор груза с адреса	руб.	1	1350	1350	2026-03-26 06:58:33.092
527	444	Транспортные услуги по маршруту г. Белгород - г. Рязань Палета — от 0 кг до 300 кг	пал	1	6300	6300	2026-03-26 06:58:33.092
529	444	Помощь на выгрузке	руб.	20	10	200	2026-03-26 06:58:33.092
282	267	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 16:24:31.407
284	269	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 16:26:25.015
285	270	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 16:34:00.082
291	276	WB Курск FBS FBS — 0.1	м³	0.2	2000	400	2026-03-18 18:38:30.686
651	533	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-03-29 19:17:36.284
525	443	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-03-26 06:35:54.487
680	551	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-03-30 07:49:01.362
534	438	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Средняя	шт	1	1100	1100	2026-03-26 09:42:17.429
535	449	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Маленькая	кор	1	790	790	2026-03-26 09:45:46.342
700	569	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-30 10:02:37.485
714	581	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	2	900	1800	2026-03-30 12:30:24.625
539	452	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	900	2700	2026-03-26 10:36:52.34
715	582	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	1	990	990	2026-03-30 12:30:56.31
541	454	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	4	900	3600	2026-03-26 12:41:16.296
729	594	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	кор	1	1100	1100	2026-03-31 07:20:16.011
730	595	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Средняя	кор	1	1000	1000	2026-03-31 07:20:45.737
747	604	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-31 07:55:33.801
769	612	Выгрузка/Cборка	рублей	1	200	200	2026-03-31 08:15:20.155
699	568	Помощь на выгрузке	руб.	1	150	150	2026-03-30 09:45:09.61
547	460	Транспортные услуги по маршруту г. Белгород - г. Тула - Большая	коробка	2	900	1800	2026-03-26 13:47:13.972
782	568	Паллетирование	руб.	1	275	275	2026-03-31 10:54:56.299
807	536	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Средняя	шт	1	890	890	2026-04-01 08:59:52.404
552	465	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-03-27 04:28:45.747
808	536	Распечатка упаковочного листа паллеты	шт	1	50	50	2026-04-01 09:00:16.724
555	468	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	900	2700	2026-03-27 07:50:25.669
556	469	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	2	990	1980	2026-03-27 08:11:32.237
557	470	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	900	2700	2026-03-27 08:23:54.292
558	471	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-03-27 08:43:42.57
559	471	Забор груза с адреса	руб.	1	1350	1350	2026-03-27 08:43:42.57
814	637	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-01 09:27:08.283
562	472	Помощь на выгрузке	руб.	8	10	80	2026-03-27 08:45:16.733
563	473	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-27 08:49:35.41
564	474	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	1	890	890	2026-03-27 08:50:30.034
566	476	тест Коробка — Большая	кор	1	10	10	2026-03-27 10:35:20.257
836	644	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-01 12:41:27.112
568	478	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-03-27 10:59:23.545
572	480	Забор груза с адреса	руб.	1	1350	1350	2026-03-27 11:22:33.911
536	450	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 301 кг до 400 кг	пал	1	7312	7312	2026-03-26 10:29:20.187
560	471	Помощь на выгрузке	руб.	36	10	360	2026-03-27 08:43:42.57
569	478	Помощь на выгрузке	руб.	23	10	230	2026-03-27 10:59:23.545
271	255	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 11:00:22.928
292	277	WB Курск FBS FBS — 0.1	м³	0.2	2000	400	2026-03-18 18:41:10.67
276	260	WB Курск FBS FBS — 0.1	м³	0.13	2000	260	2026-03-18 12:57:46.871
294	279	WB Курск FBS FBS — 0.1	м³	2	2000	4000	2026-03-18 19:24:17.904
234	221	Транспортные услуги по доставке ФБС г. Белгород - г. Курск	м³	1.35	2000	2700	2026-03-17 07:24:40.937
794	633	Транспортные услуги по маршруту г. Белгород - г. Щербинка	кор	1	6300	6300	2026-03-31 18:15:52.406
573	481	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — от 5 до 10 коробок	кор	1	5500	5500	2026-03-27 11:35:33.238
574	482	Транспортные услуги по маршруту г. Белгород - г. Курск - Палета  от 301 кг до 400 кг	шт	1	6000	6000	2026-03-27 11:50:32.013
584	485	Помощь на выгрузке	шт	30	10	300	2026-03-27 12:20:21.031
576	484	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  Большая	шт	6	850	5100	2026-03-27 12:04:34.306
577	471	Паллетирование	руб.	2	275	550	2026-03-27 12:15:59.892
578	471	Предоставление деревянного поддона	руб.	2	375	750	2026-03-27 12:16:08.507
579	485	Транспортные услуги по маршруту г. Белгород - г. Тула - Палета  от 0 кг до 300 кг	шт	2	5300	10600	2026-03-27 12:19:14.41
731	573	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	2	1040	2080	2026-03-31 07:21:14.699
581	485	Предоставление деревянного поддона	руб.	2	375	750	2026-03-27 12:19:30.763
582	486	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	2	5300	10600	2026-03-27 12:19:56.825
583	486	Помощь на выгрузке	руб.	2	10	20	2026-03-27 12:19:56.825
585	487	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	2	1040	2080	2026-03-27 12:41:12.639
586	487	Помощь на выгрузке	руб.	2	10	20	2026-03-27 12:41:12.639
580	485	Паллетирование	руб.	2	275	550	2026-03-27 12:19:19.548
597	493	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Средняя	кор	1	950	950	2026-03-27 13:59:39.615
590	490	Забор груза с адреса	руб.	1	500	500	2026-03-27 13:09:19.73
591	472	Транспортные услуги по маршруту г. Белгород - г. Подольск - Коробка  от 5 до 10 коробок	шт	1	4750	4750	2026-03-27 13:10:20.882
750	606	Забор груза с адреса	руб.	1	1350	1350	2026-03-31 08:00:05.841
592	478	Паллетирование	руб.	2	275	550	2026-03-27 13:13:32.349
652	497	Паллетирование	руб.	1	275	275	2026-03-30 06:23:05.548
593	478	Предоставление деревянного поддона	руб.	2	375	750	2026-03-27 13:13:37.647
595	464	Транспортные услуги по маршруту г. Белгород - г. Казань - Коробка  Средняя	шт	1	940	940	2026-03-27 13:34:46.725
596	492	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	1	750	750	2026-03-27 13:39:49.093
653	497	Предоставление деревянного поддона	руб.	1	375	375	2026-03-30 06:23:07.963
603	497	Помощь на выгрузке	руб.	16	10	160	2026-03-27 21:02:58.355
602	497	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 301 кг до 400 кг	пал	1	6350	6350	2026-03-27 21:02:58.355
655	535	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	3	850	2550	2026-03-30 06:25:15.139
589	490	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4	2000	8000	2026-03-27 13:09:19.73
701	570	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-03-30 10:17:31.836
716	583	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	кор	2	990	1980	2026-03-30 12:45:20.583
783	623	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	4	1200	4800	2026-03-31 10:56:11.988
770	612	Паллетирование	руб.	1	275	275	2026-03-31 08:15:35.535
612	506	Транспортные услуги по маршруту г. Белгород - г. Курск Коробка — Средняя	кор	3	750	2250	2026-03-28 13:38:29.169
771	612	Предоставление деревянного поддона	руб.	1	375	375	2026-03-31 08:15:38.466
614	508	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Средняя	кор	1	940	940	2026-03-28 13:44:20.656
772	615	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-31 08:18:19.552
616	509	Забор груза с адреса	руб.	1	500	500	2026-03-28 13:59:23.424
617	509	Помощь на выгрузке	руб.	4	10	40	2026-03-28 13:59:23.424
795	540	Предоставление деревянного поддона	руб.	1	375	375	2026-04-01 08:28:19.269
619	510	Помощь на выгрузке	руб.	5	10	50	2026-03-28 14:03:54.598
796	540	Паллетирование	руб.	1	275	275	2026-04-01 08:28:25.554
809	554	Транспортные услуги по маршруту г. Белгород - г. Краснодар - Коробка  Большая	шт	2	990	1980	2026-04-01 09:00:53.013
815	638	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-01 09:55:06.378
819	640	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-01 10:16:57.928
827	641	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-01 11:14:01.892
828	642	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	3	900	2700	2026-04-01 11:14:53.429
831	552	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург - Коробка  Большая	шт	1	1200	1200	2026-04-01 12:21:00.536
734	598	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — от 5 до 10 коробок	кор	1	6500	6500	2026-03-31 07:27:01.26
634	524	Забор груза с адреса	руб.	1	500	500	2026-03-29 07:47:54.329
636	525	Забор груза с адреса	руб.	1	500	500	2026-03-29 07:48:04.831
620	511	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4	2000	8000	2026-03-28 14:09:14.391
621	512	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-28 14:12:53.477
622	513	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-28 14:15:45.87
633	524	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-29 07:47:54.329
639	526	Хранение до куба	руб./день	1	50	50	2026-03-29 10:43:00.337
641	527	Помощь на выгрузке	руб.	4	10	40	2026-03-29 14:56:01.086
623	514	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2000	4000	2026-03-28 14:32:18.191
624	515	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-28 14:32:30.956
625	516	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-28 14:37:53.558
626	517	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4	2000	8000	2026-03-28 14:44:38.724
627	518	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	5	2000	10000	2026-03-28 14:46:09.622
638	526	Помощь на выгрузке	рублей	2	10	20	2026-03-29 10:42:56.229
628	519	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	6	2000	12000	2026-03-28 14:53:10.265
629	520	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.55	2000	1100	2026-03-28 14:54:54.701
630	521	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-28 14:58:00.793
632	523	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-28 15:20:56.196
751	607	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Маленькая	кор	6	700	4200	2026-03-31 08:01:29.5
189	195	WB Курск FBS FBS — 0.1	м³	0.32	2000	640	2026-03-15 20:12:21.387
190	196	WB Курск FBS FBS — 0.1	м³	0.43	2000	860	2026-03-15 20:34:36.197
191	197	WB Курск FBS FBS — 0.1	м³	0.11	2000	220	2026-03-15 21:04:30.182
194	199	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-16 08:32:25.787
196	201	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-16 09:19:32.936
198	203	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-16 09:45:18.414
199	204	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-16 09:48:14.093
248	234	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-17 16:43:46.919
252	238	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 08:22:28.22
255	241	WB Курск FBS FBS — 0.1	м³	4	2000	8000	2026-03-18 08:32:21.624
258	244	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 08:33:43.81
264	248	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 08:58:30.191
784	624	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	5	900	4500	2026-03-31 11:02:45.139
631	522	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2000	4000	2026-03-28 15:03:16.75
702	571	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	4	990	3960	2026-03-30 11:03:46.345
717	584	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-03-30 12:57:34.144
732	596	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1200	1200	2026-03-31 07:24:59.213
773	616	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-31 08:18:55.129
797	576	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Большая	шт	5	990	4950	2026-04-01 08:29:34.923
798	576	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Палета  от 401 кг до 500 кг	шт	1	9900	9900	2026-04-01 08:29:40.841
799	576	Помощь на выгрузке	шт	25	10	250	2026-04-01 08:29:52.785
753	609	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Маленькая	кор	4	840	3360	2026-03-31 08:02:48.297
635	525	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-03-29 07:48:04.831
299	284	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-19 06:30:26.858
301	286	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 07:29:23.751
314	295	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 10:00:05.764
320	299	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.31	2000	620	2026-03-19 12:25:28.827
209	212	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-16 12:37:44.945
210	213	WB Курск FBS FBS — 0.1	м³	0.3	2000	600	2026-03-16 12:47:59.195
211	214	WB Курск FBS FBS — 0.1	м³	0.3	2000	600	2026-03-16 13:17:28.09
290	275	WB Курск FBS FBS — 0.1	м³	0.2	2000	400	2026-03-18 18:28:34.796
270	254	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 10:38:48.97
226	219	WB Курск FBS FBS — 0.1	м³	0.2	2000	400	2026-03-16 18:48:14.632
233	220	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-17 07:23:18.435
236	223	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-17 07:25:49.044
243	229	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-17 11:44:21.42
245	231	WB Курск FBS FBS — 0.1	м³	0.09	1000	90	2026-03-17 12:44:37.7
249	235	WB Курск FBS FBS — 0.1	м³	0.8	2000	1600	2026-03-18 05:14:50.91
250	236	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 07:18:39.771
254	240	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 08:25:00.473
257	243	WB Курск FBS FBS — 0.1	м³	3	2000	6000	2026-03-18 08:33:43.452
260	245	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 08:44:15.978
275	259	WB Курск FBS FBS — 0.1	м³	0.1	2000	200	2026-03-18 12:14:08.601
277	261	WB Курск FBS FBS — 0.1	м³	0.52	2000	1040	2026-03-18 13:27:55.711
279	263	WB Курск FBS FBS — 0.1	м³	0.65	2000	1300	2026-03-18 13:51:52.084
235	222	Транспортные услуги по доставке ФБС г. Белгород - г. Курск	м³	1.35	2000	2700	2026-03-17 07:25:02.343
268	252	WB Курск FBS FBS — 0.1	м³	0.3	2000	600	2026-03-18 10:12:07.747
293	278	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-18 18:51:20.857
281	265	Транспортные услуги ФБС по маршруту г. Белгород - г. Курск (17.03.2026 и 18.03.2026)	м³	21	2000	42000	2026-03-18 15:16:10.396
283	268	WB Курск FBS FBS — 0.1	м³	1	2000	2000	2026-03-18 16:25:23.112
295	280	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-03-18 19:31:27.4
296	281	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-03-18 19:34:57.241
300	285	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 06:30:57.162
302	287	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 07:39:15.653
304	290	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	6	2000	12000	2026-03-19 08:58:07.444
315	296	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-19 10:53:27.171
322	301	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 12:44:46.522
351	311	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.8	2000	1600	2026-03-20 08:06:21.03
352	312	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-20 08:19:17.004
353	313	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 08:20:28.334
354	314	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-03-20 08:43:36.678
368	323	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 13:55:23.545
369	324	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 14:06:56.399
328	303	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-19 13:39:38.052
329	304	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-19 14:05:23.343
357	316	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 09:30:00.752
332	305	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-19 14:13:03.241
323	302	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	8	2000	16000	2026-03-19 12:56:24.368
335	306	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-19 14:31:01.904
338	307	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.17	2000	340	2026-03-19 15:38:23.353
345	308	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.7	2000	1400	2026-03-20 07:19:29.343
348	309	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 07:28:51.471
360	319	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 10:54:39.35
361	320	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.04	2000	80	2026-03-20 12:30:55.692
362	321	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-20 12:54:35.84
363	322	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-20 13:06:48.176
370	325	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.8	2000	1600	2026-03-21 05:25:51.66
373	326	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-21 06:22:36.662
374	327	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-21 09:09:39.005
375	328	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-21 09:31:20.025
378	331	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-21 11:02:27.751
379	332	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.62	2000	1240	2026-03-21 11:27:46.157
380	333	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.325	2000	650	2026-03-21 11:56:40.31
387	338	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.9	2000	3800	2026-03-22 09:33:50.384
390	339	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-22 10:24:36.08
395	342	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-22 14:40:38.932
414	359	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-23 09:57:01.852
415	360	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-23 10:49:29.271
416	361	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.725	2000	1450	2026-03-23 10:51:07.296
417	362	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.35	2000	700	2026-03-23 10:52:58.153
420	365	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.21	2000	420	2026-03-23 12:05:22.666
421	366	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.9	2000	1800	2026-03-23 12:15:38.09
422	367	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-03-23 12:32:48.659
423	368	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-23 13:08:54.362
441	381	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.13	2000	260	2026-03-23 16:22:32.914
443	383	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-23 17:45:09.023
444	384	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-03-23 17:46:14.286
446	385	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-23 17:48:11.207
424	369	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4	2000	8000	2026-03-23 13:10:00.008
447	386	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.1	2000	2200	2026-03-23 18:22:11.887
456	394	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.725	2000	1450	2026-03-24 04:05:34.276
453	392	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-23 20:08:44.166
455	393	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.725	2000	1450	2026-03-24 04:04:50.033
457	395	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-24 04:07:54.804
458	396	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-03-24 04:12:04.406
459	397	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-03-24 04:17:59.206
474	409	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-24 13:06:26.364
476	411	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-24 14:27:31.981
481	415	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 07:57:34.344
480	414	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	8	2000	16000	2026-03-25 07:18:34.753
488	417	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-25 09:39:23.879
489	418	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-25 09:45:27.939
490	419	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 09:45:35.63
495	424	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.45	2000	2900	2026-03-25 10:13:11.401
502	426	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 10:26:57.842
505	428	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.25	2000	500	2026-03-25 10:37:04.67
510	430	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 10:47:33.268
523	441	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-25 14:32:20.759
515	433	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 11:29:32.037
517	435	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.51	2000	1020	2026-03-25 12:32:23.136
518	436	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 12:35:37.037
519	437	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-25 12:38:59.059
530	445	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 07:21:11.395
531	446	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 08:27:33.43
532	447	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-26 08:49:23.783
533	448	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 09:31:49.235
538	451	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 10:32:17.616
542	455	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.47	2000	940	2026-03-26 12:51:28.89
543	456	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-26 13:35:23.5
544	457	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.24	2000	480	2026-03-26 13:36:02.266
540	453	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-03-26 11:10:44.876
545	458	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 13:42:16.3
546	459	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-26 13:43:04.581
548	461	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-26 13:55:44.081
549	462	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-26 18:35:29.417
550	463	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-26 18:35:53.161
554	467	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-27 07:21:44.434
565	475	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-27 09:49:22.085
567	477	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-27 10:53:03.472
570	479	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-27 11:13:43.908
575	483	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.6	2000	1200	2026-03-27 12:01:07.71
587	488	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-03-27 12:43:28.322
588	489	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-27 12:49:17.204
594	491	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.38	2000	760	2026-03-27 13:13:52.127
599	494	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-27 14:02:34.633
600	495	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.6	2000	1200	2026-03-27 14:03:50.159
601	496	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-03-27 14:08:25.129
604	498	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-28 08:20:06.979
605	499	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-28 08:27:45.944
606	500	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2000	4000	2026-03-28 09:07:40.86
607	501	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	5	2000	10000	2026-03-28 09:14:34.465
608	502	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-28 09:46:52.782
609	503	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.32	2000	640	2026-03-28 10:44:40.592
610	504	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-03-28 13:35:14.347
611	505	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-03-28 13:37:20.506
613	507	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2000	4000	2026-03-28 13:44:09.13
615	509	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-03-28 13:59:23.424
618	510	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-03-28 14:03:54.598
657	537	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Маленькая	кор	1	750	750	2026-03-30 06:27:30.808
658	538	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-03-30 06:28:57.557
659	538	Помощь на выгрузке	руб.	1	10	10	2026-03-30 06:28:57.557
688	559	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	2	890	1780	2026-03-30 07:58:39.632
703	572	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	4	1040	4160	2026-03-30 11:04:27.831
718	585	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Средняя	кор	3	1000	3000	2026-03-30 12:57:52.828
719	586	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Средняя	кор	1	890	890	2026-03-30 12:58:44.088
851	647	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-01 15:36:00.579
852	648	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-04-01 15:37:27.544
853	649	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1200	1200	2026-04-01 15:38:17.789
854	650	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	1	890	890	2026-04-01 15:38:56.965
855	651	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-04-01 15:39:27.126
857	652	Забор груза с адреса	руб.	1	500	500	2026-04-01 16:32:28.138
858	653	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	200	4000	2026-04-01 16:32:46.013
859	653	Забор груза с адреса	руб.	1	500	500	2026-04-01 16:32:46.013
861	654	Забор груза с адреса	руб.	1	500	500	2026-04-01 16:32:58.237
862	655	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-04-01 17:30:13.818
863	656	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	1	5300	5300	2026-04-01 17:56:37.695
865	658	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — Средняя	кор	1	940	940	2026-04-01 19:26:52.755
866	659	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-04-01 19:28:29.183
867	660	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-02 06:35:35.476
868	661	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	200	300	2026-04-02 07:19:17.871
869	657	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	1	1040	1040	2026-04-02 07:31:05.301
870	662	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	5	990	4950	2026-04-02 07:34:13.98
856	652	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2500	5000	2026-04-01 16:32:28.138
860	654	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	2000	6000	2026-04-01 16:32:58.237
850	646	Помощь на выгрузке	руб.	2	200	400	2026-04-01 14:55:36.994
871	646	Паллетирование	руб.	2	275	550	2026-04-02 07:34:29.378
872	646	Предоставление деревянного поддона	руб.	2	375	750	2026-04-02 07:34:34.124
873	663	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	1	950	950	2026-04-02 08:33:46.135
876	664	Забор груза с адреса	руб.	1	1350	1350	2026-04-02 09:18:13.28
877	665	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-02 09:41:43.463
878	666	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-04-02 09:42:08.108
879	667	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-02 10:01:01.222
880	668	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.6	2000	1200	2026-04-02 10:03:19.777
881	669	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-04-02 10:03:51.925
882	669	Помощь на выгрузке	руб.	1	10	10	2026-04-02 10:03:51.925
883	670	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-04-02 10:29:46.697
884	671	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-02 10:30:55.629
906	691	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	200	4000	2026-04-02 16:57:44.595
907	692	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — от 5 до 10 коробок	кор	1	4250	4250	2026-04-02 16:57:53.559
885	672	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	14	200	2800	2026-04-02 10:40:41.814
887	673	Помощь на выгрузке	руб.	7	10	70	2026-04-02 10:44:31.194
888	674	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.42	2000	840	2026-04-02 11:09:38.325
889	675	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-04-02 11:11:14.697
890	676	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-02 11:44:54.635
891	677	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-04-02 12:08:04.916
892	678	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	кор	1	990	990	2026-04-02 12:08:41.564
893	679	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-04-02 12:19:06.378
894	680	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Маленькая	кор	1	790	790	2026-04-02 12:36:20.289
895	681	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Маленькая	кор	1	750	750	2026-04-02 12:36:49.948
896	682	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.33	200	660	2026-04-02 12:42:48.723
886	673	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — от 5 до 10 коробок	кор	1	5250	5250	2026-04-02 10:44:31.194
898	684	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	1	990	990	2026-04-02 14:50:16.981
899	685	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	1	950	950	2026-04-02 14:50:54.24
900	686	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Маленькая	кор	4	750	3000	2026-04-02 15:04:01.397
901	686	Забор груза с адреса	руб.	1	1350	1350	2026-04-02 15:04:01.397
902	686	Помощь на выгрузке	руб.	4	10	40	2026-04-02 15:04:01.397
903	687	Транспортные услуги по маршруту г. Белгород - МО (Lamoda  Софьино) Коробка — Большая	кор	15	950	14250	2026-04-02 16:12:24.405
904	688	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-02 16:25:05.038
905	689	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-02 16:30:18.277
908	692	Гофрокартон 60х40х40 (б/у 5ти слойные)	шт	10	60	600	2026-04-02 16:58:19.768
909	691	Помощь на выгрузке	шт	6	10	60	2026-04-02 16:59:12.211
910	693	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-04-02 20:51:44.273
911	694	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Маленькая	кор	1	750	750	2026-04-02 20:52:53.556
912	695	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 06:25:09.095
959	722	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.41	200	820	2026-04-04 12:33:59.625
1003	742	Выгрузка/Cборка	рублей	1	200	200	2026-04-06 09:18:08.576
1004	753	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-04-06 09:30:18.079
916	697	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	2	890	1780	2026-04-03 07:37:10.905
917	698	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-04-03 07:38:04.842
918	699	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 08:37:45.601
919	700	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 09:03:13.949
920	701	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 09:11:46.743
921	702	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	4	900	3600	2026-04-03 09:26:54.085
923	703	Забор груза с адреса	руб.	1	1350	1350	2026-04-03 09:27:15.253
924	704	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 10:09:07.986
925	705	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-03 11:16:26.425
926	706	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	4	1040	4160	2026-04-03 11:46:49.343
553	466	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — от 5 до 10 коробок	кор	1	660	660	2026-03-27 07:04:29.356
927	664	Транспортные услуги по маршруту г. Белгород - г. Рязань - Палета  от 0 кг до 300 кг	шт	1	6300	6300	2026-04-03 12:12:45.248
928	664	Паллетирование	руб.	1	275	275	2026-04-03 12:12:51.117
929	664	Выгрузка/Cборка	рублей	1	200	200	2026-04-03 12:13:03.367
930	656	Паллетирование	руб.	1	275	275	2026-04-03 12:15:05.794
931	656	Предоставление деревянного поддона	руб.	1	375	375	2026-04-03 12:15:08.477
932	656	Выгрузка/Cборка	рублей	1	200	200	2026-04-03 12:15:12.061
933	632	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  от 5 до 10 коробок	шт	1	4300	4300	2026-04-03 12:18:52.431
934	632	Помощь на выгрузке	рублей	5	10	50	2026-04-03 12:19:01.665
935	707	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 12:21:27.904
936	683	Транспортные услуги по маршруту г. Белгород - г. Коледино - Коробка  Средняя	шт	1	850	850	2026-04-03 12:21:47.269
937	708	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-03 12:22:22.193
938	662	Гофрокартон 60х40х40 (б/у 5ти слойные)	руб.	5	120	600	2026-04-03 12:24:45.639
939	662	Распечатка упаковочного листа паллеты	шт	1	50	50	2026-04-03 12:25:10.304
954	717	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-04 09:49:07.175
940	662	Упаковка товара	ед	700	11	7700	2026-04-03 12:25:14.993
941	633	Паллетирование	руб.	1	275	275	2026-04-03 12:27:50.005
942	633	Предоставление деревянного поддона	руб.	1	375	375	2026-04-03 12:27:56.766
943	633	Выгрузка/Cборка	рублей	1	200	200	2026-04-03 12:28:29.292
944	709	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	200	800	2026-04-03 12:30:18.936
946	711	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-03 13:10:47.405
947	712	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	1	1200	1200	2026-04-03 17:52:29.527
949	713	Забор груза с адреса	руб.	1	500	500	2026-04-04 05:15:20.557
950	713	Помощь на выгрузке	руб.	20	10	200	2026-04-04 05:15:20.557
951	714	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-04 06:15:38.736
952	715	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-04 08:35:27.199
955	718	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	200	4000	2026-04-04 10:22:08.895
956	719	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	200	4000	2026-04-04 10:22:14.379
957	720	Транспортные услуги по маршруту г. Белгород - г. Волгоград - Палета  от 301 кг до 400 кг	шт	1	8900	8900	2026-04-04 11:07:24.939
958	721	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.45	200	900	2026-04-04 12:04:09.074
948	713	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-04-04 05:15:20.557
915	696	Помощь на выгрузке	руб.	8	10	80	2026-04-03 06:56:17.073
953	716	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.4	2000	800	2026-04-04 09:15:06.455
922	703	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Большая	кор	1	2970	2970	2026-04-03 09:27:15.253
961	724	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-04 12:46:13.845
962	725	Транспортные услуги по маршруту г. Белгород - г. Коледино Палета — от 0 кг до 300 кг	пал	5	6300	31500	2026-04-04 13:12:27.53
963	725	Забор груза с адреса	руб.	1	1350	1350	2026-04-04 13:12:27.53
964	726	Транспортные услуги по маршруту г. Белгород - г. Подольск Коробка — Маленькая	кор	1	750	750	2026-04-05 08:24:08.363
966	727	Помощь на выгрузке	руб.	26	10	260	2026-04-05 15:02:41.706
967	728	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Большая	кор	3	900	2700	2026-04-05 22:26:03.887
968	729	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Маленькая	кор	1	840	840	2026-04-06 04:29:48.987
969	729	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Большая	кор	1	1040	1040	2026-04-06 04:29:48.987
970	730	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	4	1040	4160	2026-04-06 05:47:37.028
972	731	Помощь на выгрузке	руб.	1	10	10	2026-04-06 05:51:26.544
973	732	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Средняя	кор	1	940	940	2026-04-06 05:52:03.135
974	732	Помощь на выгрузке	руб.	1	10	10	2026-04-06 05:52:03.135
975	733	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	1	890	890	2026-04-06 05:52:32.705
976	733	Помощь на выгрузке	руб.	1	10	10	2026-04-06 05:52:32.705
977	734	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	кор	1	1100	1100	2026-04-06 05:53:52.909
978	734	Помощь на выгрузке	руб.	1	10	10	2026-04-06 05:53:52.909
979	735	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-06 05:58:03.568
981	737	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4	200	8000	2026-04-06 06:30:24.953
982	737	Забор груза с адреса	руб.	1	500	500	2026-04-06 06:30:24.953
983	738	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — от 5 до 10 коробок	кор	1	4500	4500	2026-04-06 06:39:50.445
984	739	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — от 5 до 10 коробок	кор	1	5000	5000	2026-04-06 06:41:44.476
985	740	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-04-06 06:42:06.493
986	741	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-06 06:48:57.594
987	742	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Палета — от 401 кг до 500 кг	пал	1	14000	14000	2026-04-06 06:54:46.572
989	736	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  Большая	шт	3	1040	3120	2026-04-06 06:56:54.183
992	743	Помощь на выгрузке	руб.	6	10	60	2026-04-06 07:12:50.055
993	744	Транспортные услуги по маршруту г. Белгород - г. Краснодар Коробка — Большая	кор	1	990	990	2026-04-06 07:14:54.781
995	745	Транспортные услуги по маршруту г. Белгород - г. Невинномысск - Коробка  Средняя	шт	1	890	890	2026-04-06 07:40:55.827
996	746	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	кор	1	7500	7500	2026-04-06 07:45:55.995
998	748	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	1	850	850	2026-04-06 07:50:12.676
1000	750	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-06 08:29:59.209
1001	751	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	1	950	950	2026-04-06 08:43:02.002
1002	752	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-06 09:13:55.064
945	710	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	200	200	2026-04-03 13:05:22.771
997	747	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — от 5 до 10 коробок	кор	1	5500	5500	2026-04-06 07:49:49.828
1125	857	WB Воронеж	место	5	750	3750	2026-04-08 14:35:51.948
999	749	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	200	200	2026-04-06 08:02:36.044
991	743	Забор груза с адреса	руб.	1	800	800	2026-04-06 07:12:50.055
1005	754	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	8000	10800	2026-04-06 09:48:45.23
1010	758	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.2	2000	2400	2026-04-06 10:05:31.024
1011	759	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.15	2000	300	2026-04-06 10:08:05.11
1012	760	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-06 10:09:10.349
1013	731	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Большая	шт	1	900	900	2026-04-06 10:27:51.818
1015	755	Транспортные услуги по маршруту г. Белгород - г. Котовск - Коробка  Средняя	шт	6	800	4800	2026-04-06 10:39:01.865
1016	756	Выгрузка/Cборка	рублей	1	200	200	2026-04-06 10:50:48.325
1043	784	Забор груза с адреса	руб.	1	1350	1350	2026-04-07 06:40:07.082
1007	756	Транспортные услуги по маршруту г. Белгород - г. Котовск Палета — 600	пал	1	8450	8450	2026-04-06 10:01:38.74
1017	757	Выгрузка/Cборка	рублей	1	200	200	2026-04-06 10:51:24.408
1009	757	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — 600	пал	1	10900	10900	2026-04-06 10:02:14.276
1021	765	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.86	200	1720	2026-04-06 12:39:30.749
1022	766	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	6	1200	7200	2026-04-06 12:40:47.856
1023	767	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-06 12:45:48.501
1025	769	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-04-06 13:58:47.416
1026	770	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-06 13:59:41.691
1027	771	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — Средняя	кор	1	800	800	2026-04-06 14:12:08.423
1029	772	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-04-06 16:06:42.185
1030	773	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	200	1000	2026-04-06 18:24:41.104
1032	775	Транспортные услуги по маршруту г. Белгород - г. Сарапул Коробка — Большая	кор	1	1100	1100	2026-04-06 18:51:20.037
1033	776	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург Коробка — Маленькая	кор	1	840	840	2026-04-06 18:54:51.35
1036	779	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	200	4000	2026-04-06 19:48:56.173
1045	785	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-07 07:31:01.888
1046	786	Транспортные услуги по маршруту г. Белгород - г. Волгоград Коробка — Маленькая	кор	1	790	790	2026-04-07 07:49:39.42
1037	780	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	200	200	2026-04-06 19:53:32.775
1047	787	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-04-07 07:50:40.319
1038	781	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-06 20:45:26.081
1039	782	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-07 06:16:20.095
1041	783	Забор груза с адреса	руб.	1	500	500	2026-04-07 06:36:07.265
1050	790	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	3	950	2850	2026-04-07 08:56:30.001
1051	791	Транспортные услуги по маршруту г. Белгород - г. Тула Палета — от 0 кг до 300 кг	пал	1	5300	5300	2026-04-07 09:10:33.337
1040	783	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-04-07 06:36:07.265
1042	784	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 0 кг до 300 кг	пал	1	6800	6800	2026-04-07 06:40:07.082
1044	784	Помощь на выгрузке	руб.	30	10	300	2026-04-07 06:40:07.082
1049	789	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	800	2400	2026-04-07 08:49:20.275
1048	788	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	3	890	2670	2026-04-07 08:48:37.497
1054	792	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.225	200	450	2026-04-07 09:44:57.033
1055	793	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	1	890	890	2026-04-07 10:28:10.395
1057	795	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-07 11:19:00.687
1024	768	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.9	200	1800	2026-04-06 12:48:19.185
1058	796	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.52	200	1040	2026-04-07 12:04:28.038
1059	797	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-07 13:18:15.409
1060	798	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	кор	3	850	2550	2026-04-07 14:19:33.919
1061	798	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	кор	2	950	1900	2026-04-07 14:19:33.919
1062	799	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-04-07 14:20:53.813
1063	799	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	4	900	3600	2026-04-07 14:20:53.813
1064	800	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	1	850	850	2026-04-07 16:15:21.343
1066	801	Забор груза с адреса	руб.	1	500	500	2026-04-08 06:22:23.501
1067	802	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Маленькая	кор	2	790	1580	2026-04-08 06:36:13.745
1069	802	Помощь на выгрузке	руб.	2	10	20	2026-04-08 06:36:13.745
1070	803	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 07:07:26.042
1071	804	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 07:08:00.126
1072	805	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 08:27:56.612
1073	806	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — от 5 до 10 коробок	кор	1	4750	4750	2026-04-08 08:33:08.942
1074	807	Транспортные услуги по маршруту г. Белгород - г. Воронеж Палета — от 0 кг до 300 кг	пал	1	5000	5000	2026-04-08 08:59:36.892
1075	807	Забор груза с адреса	руб.	1	1350	1350	2026-04-08 08:59:36.892
1076	808	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 09:25:36.605
1077	808	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 09:25:36.605
1078	809	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	200	6000	2026-04-08 10:10:01.912
1111	842	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.01	200	20	2026-04-08 10:23:36.843
1112	843	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 11:25:59.441
1113	844	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	3	200	6000	2026-04-08 11:33:37.525
1114	846	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-08 11:39:14.043
1115	847	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-08 11:42:22.56
1116	848	WB Курск - от 301 кг до 400 кг	палета	1	6000	6000	2026-04-08 11:58:22.9
1117	849	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-08 12:05:14.712
1118	850	WB Курск - Средняя	место	1	750	750	2026-04-08 12:17:28.69
1119	851	WB Курск - от 301 кг до 400 кг	палета	1	6000	6000	2026-04-08 12:18:29.706
1120	852	WB Краснодар - от 301 кг до 400 кг	палета	1	8900	8900	2026-04-08 12:20:53.485
1121	853	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-08 12:47:43.483
1123	855	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-08 14:14:35.295
1124	856	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2000	2000	2026-04-08 14:32:41.196
1126	858	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	кор	1	950	950	2026-04-08 18:02:01.539
1127	859	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Палета — от 0 кг до 300 кг	пал	1	8300	8300	2026-04-09 06:18:08.201
1128	859	Забор груза с адреса	руб.	1	1350	1350	2026-04-09 06:18:08.201
1053	791	Помощь на выгрузке	руб.	27	10	270	2026-04-07 09:10:33.337
1065	801	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-04-08 06:22:23.501
1122	854	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	кор	1	850	850	2026-04-08 12:56:52.399
1129	860	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Большая	кор	2	950	1900	2026-04-09 08:04:17.104
1130	860	Помощь на выгрузке	руб.	2	10	20	2026-04-09 08:04:17.104
1132	862	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Большая	кор	3	1200	3600	2026-04-09 08:18:05.752
1133	862	Помощь на выгрузке	руб.	3	10	30	2026-04-09 08:18:05.752
1134	863	Транспортные услуги по маршруту г. Белгород - г. Рязань Коробка — Средняя	кор	1	850	850	2026-04-09 08:23:35.228
1138	866	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	2000	1000	2026-04-09 08:41:40.331
1139	867	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.86	2000	1720	2026-04-09 08:42:54.378
1140	868	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.75	2000	3500	2026-04-09 08:45:09.013
1056	794	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	200	200	2026-04-07 10:28:47.672
1141	869	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	4.05	2000	8100	2026-04-09 09:26:09.53
1143	870	Забор груза с адреса	руб.	1	500	500	2026-04-09 09:38:00.435
1145	871	Забор груза с адреса	руб.	1	500	500	2026-04-09 09:38:15.502
1147	872	Забор груза с адреса	руб.	1	500	500	2026-04-09 09:38:28.477
1148	873	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-09 09:47:05.233
1149	761	Транспортные услуги по маршруту г. Белгород - г. Курск - Коробка  от 5 до 10 коробок	шт	1	4300	4300	2026-04-09 10:19:12.897
1150	874	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-09 10:19:50.015
1151	791	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	шт	1	4500	4500	2026-04-09 10:19:57.296
1152	791	Забор груза с адреса до 80 коробов (8 м³)	руб.	1	1350	1350	2026-04-09 10:20:24.716
1153	791	Предоставление деревянного поддона	руб.	1	375	375	2026-04-09 10:20:57.75
1154	791	Паллетирование	руб.	1	275	275	2026-04-09 10:21:01.533
1155	763	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  Большая	шт	2	900	1800	2026-04-09 10:23:16.119
1156	784	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  от 5 до 10 коробок	шт	1	5000	5000	2026-04-09 10:27:11.275
1157	784	Паллетирование	руб.	1	275	275	2026-04-09 10:27:22.459
1158	784	Предоставление деревянного поддона	руб.	1	375	375	2026-04-09 10:27:25.369
1159	764	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Большая	шт	2	990	1980	2026-04-09 10:28:08.232
1160	875	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-09 10:47:23.726
1161	762	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург - Коробка  Большая	шт	1	1040	1040	2026-04-09 10:51:42.722
1167	878	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.325	200	650	2026-04-09 11:47:47.949
1162	696	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург - Коробка  от 5 до 10 коробок	шт	1	5500	5500	2026-04-09 10:52:57.657
1163	876	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Маленькая	кор	1	790	790	2026-04-09 11:06:47.975
1165	877	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-09 11:11:48.904
1137	865	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.144	2000	288	2026-04-09 08:29:56.569
1166	723	Транспортные услуги по маршруту г. Белгород - г. Санкт-Петербург - Коробка  от 5 до 10 коробок	шт	1	5500	5500	2026-04-09 11:42:12.56
1169	880	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.45	200	900	2026-04-09 12:16:57.537
1170	879	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Средняя	шт	4	890	3560	2026-04-09 12:44:05.624
1171	879	Транспортные услуги по маршруту г. Белгород - г. Электросталь - Коробка  Маленькая	шт	1	790	790	2026-04-09 12:44:08.177
1172	881	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.144	2000	288	2026-04-09 12:48:03.293
1131	861	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	1200	1200	2026-04-09 08:12:43.056
1144	871	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-04-09 09:38:15.502
1135	864	Транспортные услуги по маршруту г. Белгород - г. Электросталь Палета — от 0 кг до 300 кг	пал	2	6771	13542	2026-04-09 08:25:52.966
1146	872	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1	2300	2300	2026-04-09 09:38:28.477
1173	882	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-09 12:59:33.191
1174	883	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.141	2000	282	2026-04-09 13:02:17.955
1142	870	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	2	2300	4600	2026-04-09 09:38:00.435
1175	884	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	1.35	2000	2700	2026-04-09 13:07:30.147
1176	885	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-09 13:20:35.566
1177	886	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-09 13:21:22.033
1178	887	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.13	200	260	2026-04-09 13:29:22.681
1179	888	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	2000	200	2026-04-09 13:31:45.487
1180	889	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.3	2000	600	2026-04-09 13:36:17.335
1181	890	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	3	900	2700	2026-04-09 14:09:10.554
1184	891	Помощь на выгрузке	руб.	8	10	80	2026-04-09 15:00:41.129
1185	892	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 07:00:29.525
1186	893	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Средняя	кор	1	890	890	2026-04-10 07:34:43.542
1187	894	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Средняя	кор	1	800	800	2026-04-10 07:35:26.596
1188	895	WB Тула (Алексин) - Большая	место	1	900	900	2026-04-10 07:36:52.15
1189	896	WB Котовск - Большая	место	2	900	1800	2026-04-10 07:40:01.484
1190	742	Паллетирование	руб.	1	275	275	2026-04-10 08:18:36.585
1191	742	Предоставление деревянного поддона	руб.	1	375	375	2026-04-10 08:18:44.323
1193	897	Помощь на выгрузке	руб.	8	10	80	2026-04-10 08:28:26.359
1194	897	Забор груза с адреса	руб.	1	1350	1350	2026-04-10 08:28:26.359
1195	898	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 08:41:06.184
1196	899	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Палета — от 0 кг до 300 кг	пал	2	0	0	2026-04-10 08:45:12.514
1197	900	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-10 08:49:33.653
1198	743	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	шт	1	5500	5500	2026-04-10 08:54:52.438
1199	901	Транспортные услуги по маршруту г. Белгород - г. Тула Коробка — Большая	кор	1	900	900	2026-04-10 08:57:24.366
1200	901	Помощь на выгрузке	руб.	1	10	10	2026-04-10 08:57:24.366
1201	727	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Коробка  от 5 до 10 коробок	шт	1	5500	5500	2026-04-10 08:57:55.426
1202	727	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино - Палета  от 301 кг до 400 кг	шт	1	9300	9300	2026-04-10 08:58:03.551
1203	727	Паллетирование	руб.	1	275	275	2026-04-10 08:58:08.717
1204	727	Предоставление деревянного поддона	руб.	1	375	375	2026-04-10 08:58:12.966
1205	902	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	1	1040	1040	2026-04-10 08:59:05.242
1206	902	Помощь на выгрузке	руб.	1	10	10	2026-04-10 08:59:05.242
1207	903	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 09:14:48.456
1208	904	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.34	200	680	2026-04-10 12:16:43.877
1209	905	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 12:28:36.596
1210	897	Транспортные услуги по маршруту г. Белгород - г. Тула - Коробка  от 5 до 10 коробок	шт	1	4500	4500	2026-04-10 12:41:10.858
1211	891	Транспортные услуги по маршруту г. Белгород - г. Рязань - Коробка  от 5 до 10 коробок	шт	1	4750	4750	2026-04-10 12:50:50.391
1212	906	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 13:14:07.154
1213	907	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-10 13:21:48.607
1214	908	WB Тула (Алексин) - от 301 кг до 400 кг	палета	3	6350	19050	2026-04-10 13:22:43.283
1215	908	Паллетирование	руб.	3	275	825	2026-04-10 13:23:02.567
1216	908	Предоставление деревянного поддона	руб.	3	375	1125	2026-04-10 13:23:07.187
1217	909	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-10 16:08:29.797
1218	909	Помощь на выгрузке	руб.	2	10	20	2026-04-10 16:08:29.797
1219	910	Транспортные услуги по маршруту г. Белгород - г. Казань Коробка — от 5 до 10 коробок	кор	2	5500	11000	2026-04-10 17:09:08.659
1220	910	Помощь на выгрузке	руб.	2	10	20	2026-04-10 17:09:08.659
1221	911	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — от 5 до 10 коробок	кор	9	5000	45000	2026-04-10 20:42:28.126
1222	911	Помощь на выгрузке	руб.	9	10	90	2026-04-10 20:42:28.126
1223	912	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — от 5 до 10 коробок	кор	1	5000	5000	2026-04-10 20:45:15.241
1224	913	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	5	990	4950	2026-04-10 23:12:39.503
1225	913	Помощь на выгрузке	руб.	5	10	50	2026-04-10 23:12:39.503
1226	914	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Большая	кор	3	990	2970	2026-04-10 23:14:01.041
1227	914	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	1	890	890	2026-04-10 23:14:01.041
1228	914	Помощь на выгрузке	руб.	4	10	40	2026-04-10 23:14:01.041
1229	915	Транспортные услуги по маршруту г. Белгород - г. Новосемейкино Коробка — Большая	кор	2	1040	2080	2026-04-10 23:15:03.211
1230	915	Помощь на выгрузке	руб.	2	10	20	2026-04-10 23:15:03.211
1231	916	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-11 08:24:09.595
1232	917	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-11 09:35:36.84
1233	918	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.225	200	450	2026-04-11 12:10:45.087
1234	919	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.55	200	1100	2026-04-11 12:12:26.86
1235	920	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.1	200	200	2026-04-11 13:44:37.995
1236	921	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.55	2000	1100	2026-04-11 13:53:57.777
1237	922	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	2000	400	2026-04-11 13:56:16.624
1238	923	WB Коледино - Большая	место	6	950	5700	2026-04-12 15:37:27.259
1239	924	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	2	850	1700	2026-04-12 18:41:20.356
1240	925	Транспортные услуги по маршруту г. Белгород - г. Котовск Коробка — от 5 до 10 коробок	кор	1	4500	4500	2026-04-12 18:43:12.153
1241	926	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — от 5 до 10 коробок	кор	1	7500	7500	2026-04-12 18:48:06.629
1242	927	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Средняя	кор	1	750	750	2026-04-13 07:01:57.537
1243	927	Транспортные услуги по маршруту г. Белгород - г. Воронеж Коробка — Большая	кор	2	850	1700	2026-04-13 07:01:57.537
1244	928	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.2	200	400	2026-04-13 07:25:13.817
1245	929	Транспортные услуги по маршруту г. Белгород - г. Электросталь Коробка — Большая	кор	5	990	4950	2026-04-13 08:08:09.943
1246	930	Транспортные услуги по маршруту г. Белгород - г. Екатеринбург Коробка — Средняя	кор	1	1100	1100	2026-04-13 08:55:22.113
1247	931	Транспортные услуги по маршруту г. Белгород - г. Невинномысск Коробка — Средняя	кор	1	890	890	2026-04-13 08:56:43.991
1248	932	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	4	950	3800	2026-04-13 11:21:21.622
1249	933	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.92	200	1840	2026-04-13 11:33:02.961
1250	934	Транспортные услуги по маршруту г. Белгород - г. Коледино Коробка — Большая	кор	10	950	9500	2026-04-13 11:34:05.842
1251	935	Транспортные услуги по маршруту г. Белгород - г. Курск. (FBS)	м³	0.5	200	1000	2026-04-13 12:04:59.668
1252	935	Забор груза с адреса	руб.	1	500	500	2026-04-13 12:04:59.668
1253	935	Помощь на выгрузке	руб.	5	10	50	2026-04-13 12:04:59.668
\.


--
-- Data for Name: request_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_status_history (id, request_id, old_status, new_status, changed_at) FROM stdin;
110	165	new	shipped	2026-03-12 13:08:03.283
112	166	new	shipped	2026-03-12 13:14:41.01
114	184	new	warehouse	2026-03-15 11:20:55.743
115	184	warehouse	shipped	2026-03-15 11:21:19.631
116	198	new	warehouse	2026-03-16 06:42:36.399
117	189	new	done	2026-03-16 10:22:03.461
118	193	new	done	2026-03-16 10:22:03.464
119	196	new	done	2026-03-16 10:22:03.466
120	191	new	done	2026-03-16 10:22:03.468
121	194	new	done	2026-03-16 10:22:03.469
122	197	new	done	2026-03-16 10:22:03.471
123	195	new	done	2026-03-16 10:22:03.473
124	192	new	done	2026-03-16 10:22:03.474
130	214	new	done	2026-03-16 13:24:54.211
131	214	done	warehouse	2026-03-16 13:25:01.377
132	214	warehouse	done	2026-03-16 13:25:08.606
133	194	done	archived	2026-03-16 16:18:58.94
134	195	done	archived	2026-03-16 16:19:03.016
135	196	done	archived	2026-03-16 16:19:13.816
136	192	done	archived	2026-03-16 16:19:16.986
137	197	done	archived	2026-03-16 16:19:28.087
138	193	done	archived	2026-03-16 16:19:44.518
139	188	new	archived	2026-03-16 16:19:49.378
140	182	new	archived	2026-03-16 16:19:53.387
141	179	new	archived	2026-03-16 16:19:58.007
142	178	new	archived	2026-03-16 16:20:04.129
143	176	new	archived	2026-03-16 16:20:08.131
144	175	new	archived	2026-03-16 16:20:12.351
145	174	new	archived	2026-03-16 16:20:18.106
146	173	new	archived	2026-03-16 16:20:26.449
147	216	new	archived	2026-03-16 16:46:41.8
148	218	new	archived	2026-03-16 17:20:29.281
149	165	shipped	archived	2026-03-16 18:57:25.996
150	166	shipped	archived	2026-03-16 18:57:30.828
151	167	new	archived	2026-03-16 18:57:41.232
152	168	new	archived	2026-03-16 18:57:45.683
153	189	done	archived	2026-03-16 18:57:51.773
154	190	new	archived	2026-03-16 18:57:56.369
155	183	new	archived	2026-03-16 19:02:48.467
156	180	new	archived	2026-03-16 19:02:54.682
157	181	new	archived	2026-03-16 19:03:00.234
158	169	new	archived	2026-03-16 19:04:41.279
159	184	shipped	archived	2026-03-16 19:04:50.323
160	185	new	archived	2026-03-16 19:04:55.606
161	217	new	warehouse	2026-03-16 19:09:12.25
162	217	warehouse	shipped	2026-03-16 19:09:22.296
163	217	shipped	done	2026-03-16 19:09:29.729
164	217	done	archived	2026-03-16 19:14:50.16
165	219	new	done	2026-03-17 05:13:35.684
166	225	new	done	2026-03-17 09:23:18.996
167	212	new	warehouse	2026-03-17 09:24:16.433
168	212	warehouse	done	2026-03-17 09:24:20.129
169	213	new	done	2026-03-17 09:24:48.859
170	225	done	archived	2026-03-17 09:29:59.57
171	219	done	archived	2026-03-17 09:30:13.06
172	214	done	archived	2026-03-17 09:30:53.948
173	199	new	archived	2026-03-17 09:31:02.929
174	191	done	archived	2026-03-17 09:31:30.628
175	227	new	done	2026-03-17 11:01:51.197
176	227	done	archived	2026-03-17 11:04:24.587
177	228	new	warehouse	2026-03-17 11:59:47.446
178	229	new	warehouse	2026-03-17 11:59:52.869
179	230	new	warehouse	2026-03-17 12:19:36.108
180	231	new	done	2026-03-17 15:49:26.739
181	230	warehouse	shipped	2026-03-17 15:49:41.736
182	229	warehouse	shipped	2026-03-17 15:49:55.68
183	228	warehouse	shipped	2026-03-17 15:50:03.033
184	226	new	warehouse	2026-03-17 15:50:18.614
185	198	warehouse	shipped	2026-03-17 16:21:01.428
186	200	new	shipped	2026-03-17 16:21:17.011
187	238	new	archived	2026-03-18 08:22:58.156
188	233	new	archived	2026-03-18 08:28:50.931
189	207	new	warehouse	2026-03-18 08:41:05.896
190	207	warehouse	shipped	2026-03-18 08:41:07.437
191	205	new	warehouse	2026-03-18 08:42:32.022
192	205	warehouse	shipped	2026-03-18 08:42:33.873
193	237	new	archived	2026-03-18 09:06:43.31
194	239	new	archived	2026-03-18 09:06:48.151
195	240	new	archived	2026-03-18 09:06:51.557
196	241	new	archived	2026-03-18 09:06:55.135
197	242	new	archived	2026-03-18 09:06:57.905
198	234	new	archived	2026-03-18 09:07:05.525
199	243	new	archived	2026-03-18 09:07:13.279
200	245	new	archived	2026-03-18 09:07:17.319
201	246	new	archived	2026-03-18 09:07:20.404
202	247	new	archived	2026-03-18 09:07:23.127
204	254	new	done	2026-03-18 10:47:06.728
205	257	new	warehouse	2026-03-18 11:29:57.773
206	257	warehouse	shipped	2026-03-18 11:37:28.991
207	257	shipped	done	2026-03-18 11:37:30.944
208	250	new	archived	2026-03-18 11:39:48.581
209	249	new	archived	2026-03-18 11:39:56.662
210	224	new	archived	2026-03-18 11:40:22.801
211	258	new	archived	2026-03-18 12:03:40.792
212	257	done	archived	2026-03-18 12:50:26.26
213	256	new	archived	2026-03-18 12:51:18.358
214	259	new	done	2026-03-18 13:31:29.603
215	203	new	done	2026-03-18 13:31:54.301
216	255	new	done	2026-03-18 13:32:20.006
217	261	new	warehouse	2026-03-18 13:32:35.432
218	201	new	done	2026-03-18 13:33:12.586
219	262	new	done	2026-03-18 13:40:00.301
220	263	new	done	2026-03-18 13:53:33.083
221	232	new	archived	2026-03-18 14:03:40.044
222	221	new	done	2026-03-18 14:15:42.388
223	222	new	shipped	2026-03-18 14:16:59.221
224	264	new	done	2026-03-18 15:11:14.342
225	265	new	shipped	2026-03-18 15:21:09.226
226	261	warehouse	shipped	2026-03-18 15:21:50.956
227	266	new	archived	2026-03-18 16:17:15.735
228	267	new	archived	2026-03-18 16:26:30.551
229	268	new	archived	2026-03-18 16:26:33.458
230	269	new	archived	2026-03-18 16:26:37.016
231	270	new	archived	2026-03-18 16:45:07.568
232	273	new	archived	2026-03-18 18:14:12.56
234	271	new	archived	2026-03-18 18:14:29.41
235	277	new	archived	2026-03-18 19:25:25.171
236	275	new	archived	2026-03-18 19:25:29.966
237	276	new	archived	2026-03-18 19:25:34.693
238	278	new	archived	2026-03-18 19:25:41.699
239	279	new	archived	2026-03-18 19:25:46.425
240	281	new	archived	2026-03-18 19:36:15.258
241	280	new	archived	2026-03-18 19:36:18.27
242	282	new	archived	2026-03-18 19:40:12.888
243	289	new	archived	2026-03-19 08:57:43.968
244	292	new	archived	2026-03-19 10:08:45.332
245	290	new	archived	2026-03-19 10:08:51.232
246	274	new	warehouse	2026-03-19 10:12:12.682
247	297	new	archived	2026-03-19 12:20:27.235
248	288	new	archived	2026-03-19 12:20:31.575
249	302	new	warehouse	2026-03-19 12:56:34.362
250	287	new	warehouse	2026-03-19 12:56:53.818
251	223	new	done	2026-03-19 12:57:06.074
252	236	new	done	2026-03-19 12:57:13.275
253	299	new	warehouse	2026-03-19 12:59:41.724
254	296	new	warehouse	2026-03-19 13:07:21.119
255	235	new	done	2026-03-19 13:22:41.579
256	202	new	done	2026-03-19 13:23:18.824
257	283	new	warehouse	2026-03-19 13:29:40.712
258	204	new	done	2026-03-19 13:30:16.945
259	220	new	done	2026-03-19 13:30:23.666
260	248	new	done	2026-03-19 13:30:33.009
261	286	new	warehouse	2026-03-19 13:30:41.14
262	303	new	warehouse	2026-03-19 13:45:29.856
263	301	new	warehouse	2026-03-19 13:46:45.349
264	303	warehouse	shipped	2026-03-19 14:06:13.526
265	302	warehouse	shipped	2026-03-19 14:06:25.594
266	304	new	archived	2026-03-19 14:11:41.234
267	301	warehouse	shipped	2026-03-19 14:18:54.083
268	299	warehouse	shipped	2026-03-19 14:19:10.336
269	296	warehouse	shipped	2026-03-19 14:19:22.969
270	260	new	done	2026-03-19 14:19:40.377
271	295	new	shipped	2026-03-19 14:20:03.499
272	283	warehouse	shipped	2026-03-19 14:20:32.145
273	305	new	archived	2026-03-19 18:14:32.329
274	306	new	archived	2026-03-19 18:14:39.123
275	300	new	warehouse	2026-03-20 07:06:20.373
276	314	new	warehouse	2026-03-20 09:18:34.069
277	311	new	done	2026-03-20 09:25:17.185
278	283	shipped	done	2026-03-20 09:27:59.995
279	313	new	warehouse	2026-03-20 11:11:57.337
280	319	new	warehouse	2026-03-20 11:16:39.572
281	209	new	warehouse	2026-03-20 12:08:15.174
282	209	warehouse	shipped	2026-03-20 12:08:16.943
283	208	new	warehouse	2026-03-20 13:17:04.646
284	208	warehouse	shipped	2026-03-20 13:17:06.253
285	226	warehouse	shipped	2026-03-20 13:17:55.699
286	215	new	warehouse	2026-03-20 13:27:58.757
287	215	warehouse	shipped	2026-03-20 13:28:00.593
288	251	new	warehouse	2026-03-20 13:34:44.308
289	251	warehouse	shipped	2026-03-20 13:34:46.029
290	274	warehouse	shipped	2026-03-20 13:35:17.07
291	291	new	warehouse	2026-03-20 13:35:32.602
292	291	warehouse	shipped	2026-03-20 13:35:34.048
293	300	warehouse	shipped	2026-03-20 13:36:15.817
294	293	new	warehouse	2026-03-20 13:41:30.372
295	293	warehouse	shipped	2026-03-20 13:41:32.094
296	315	new	warehouse	2026-03-20 13:59:51.139
297	315	warehouse	shipped	2026-03-20 13:59:52.739
298	310	new	warehouse	2026-03-20 14:06:50.725
299	310	warehouse	shipped	2026-03-20 14:06:52.492
300	318	new	warehouse	2026-03-20 14:09:00.392
301	318	warehouse	shipped	2026-03-20 14:09:02.631
302	301	shipped	done	2026-03-20 14:18:40.403
303	321	new	shipped	2026-03-20 14:18:53.639
304	228	shipped	done	2026-03-20 14:19:28.988
305	229	shipped	done	2026-03-20 14:19:36.673
306	303	shipped	done	2026-03-20 14:19:45.606
307	323	new	shipped	2026-03-20 14:19:55.274
308	322	new	shipped	2026-03-20 14:21:15.208
309	287	warehouse	done	2026-03-20 15:03:56.665
310	309	new	shipped	2026-03-20 15:04:09.258
311	324	new	shipped	2026-03-20 15:04:32.236
312	319	warehouse	shipped	2026-03-20 15:06:07.206
313	316	new	shipped	2026-03-20 15:06:30.413
314	312	new	shipped	2026-03-20 15:07:02.483
315	308	new	shipped	2026-03-20 15:07:26.339
316	207	shipped	done	2026-03-20 17:31:18.29
317	208	shipped	done	2026-03-20 17:31:30.019
318	308	shipped	done	2026-03-21 10:20:42.626
319	325	new	warehouse	2026-03-21 10:21:28.554
320	329	new	done	2026-03-21 10:26:47.519
321	330	new	archived	2026-03-21 11:01:59.092
322	331	new	done	2026-03-21 11:02:34.832
323	302	shipped	done	2026-03-21 11:02:57.357
324	222	shipped	done	2026-03-21 11:03:12.234
325	187	new	done	2026-03-21 11:03:53.323
326	186	new	done	2026-03-21 11:04:04.897
327	332	new	done	2026-03-21 11:27:52.063
328	333	new	warehouse	2026-03-21 13:27:12.044
329	327	new	warehouse	2026-03-21 13:27:20.994
330	326	new	warehouse	2026-03-21 13:27:29.661
331	333	warehouse	shipped	2026-03-21 14:16:04.849
332	328	new	shipped	2026-03-21 14:16:08.845
333	327	warehouse	shipped	2026-03-21 14:16:11.573
334	326	warehouse	shipped	2026-03-21 14:16:14.04
335	325	warehouse	shipped	2026-03-21 14:16:17.828
336	347	new	warehouse	2026-03-23 06:15:01.936
337	347	warehouse	shipped	2026-03-23 06:15:03.389
338	349	new	warehouse	2026-03-23 06:30:58.78
339	349	warehouse	shipped	2026-03-23 06:31:00.367
340	348	new	warehouse	2026-03-23 06:31:24.858
341	348	warehouse	shipped	2026-03-23 06:31:26.487
342	360	new	done	2026-03-23 10:49:34.686
343	362	new	done	2026-03-23 10:53:06.254
344	325	shipped	done	2026-03-23 10:54:25.849
345	363	new	done	2026-03-23 10:57:15.284
346	285	new	done	2026-03-23 11:27:57.351
347	333	shipped	done	2026-03-23 11:27:57.357
348	328	shipped	done	2026-03-23 11:27:57.359
349	327	shipped	done	2026-03-23 11:27:57.363
350	326	shipped	done	2026-03-23 11:27:57.366
351	375	new	archived	2026-03-23 13:48:43.142
352	383	new	done	2026-03-23 17:45:21.843
353	384	new	done	2026-03-23 17:46:30.174
354	385	new	done	2026-03-23 17:48:20.058
355	366	new	done	2026-03-23 18:07:32.208
356	381	new	done	2026-03-23 18:12:40.21
357	386	new	done	2026-03-23 18:22:22.846
358	364	new	done	2026-03-23 18:23:51.883
359	316	shipped	done	2026-03-23 18:24:08.58
360	391	new	archived	2026-03-23 20:01:38.574
361	392	new	archived	2026-03-23 20:09:36.065
362	323	shipped	done	2026-03-24 03:36:57.069
363	365	new	done	2026-03-24 03:37:16.669
364	320	new	done	2026-03-24 03:38:57.942
365	394	new	archived	2026-03-24 04:06:14.983
366	393	new	done	2026-03-24 04:06:33.355
367	361	new	archived	2026-03-24 04:07:11.765
368	296	shipped	done	2026-03-24 04:07:20.043
369	321	shipped	done	2026-03-24 04:08:02.105
370	395	new	done	2026-03-24 04:08:16.416
371	367	new	done	2026-03-24 04:12:16.773
372	314	warehouse	done	2026-03-24 04:12:43.362
373	396	new	archived	2026-03-24 04:12:53.964
374	369	new	done	2026-03-24 04:13:39.223
375	397	new	done	2026-03-24 04:18:15.489
376	309	shipped	done	2026-03-24 04:18:35.356
377	398	new	archived	2026-03-24 09:04:49.537
378	300	shipped	done	2026-03-24 11:17:20.734
379	300	done	archived	2026-03-24 11:17:27.143
380	406	new	done	2026-03-24 11:53:35.635
381	407	new	done	2026-03-24 12:06:55.642
382	408	new	warehouse	2026-03-24 13:11:18.773
383	388	new	archived	2026-03-24 14:16:08.932
384	342	new	archived	2026-03-24 14:16:16.606
385	339	new	archived	2026-03-24 14:16:21.566
386	338	new	archived	2026-03-24 14:16:35.485
387	252	new	archived	2026-03-24 14:16:41.158
388	411	new	done	2026-03-24 16:36:26.573
389	294	new	warehouse	2026-03-25 07:11:34.172
390	294	warehouse	shipped	2026-03-25 07:11:36.104
391	298	new	warehouse	2026-03-25 08:47:37.649
392	298	warehouse	shipped	2026-03-25 08:47:39.184
393	317	new	warehouse	2026-03-25 08:48:31.634
394	317	warehouse	shipped	2026-03-25 08:48:34.92
395	335	new	warehouse	2026-03-25 08:50:38.545
396	335	warehouse	shipped	2026-03-25 08:50:40.068
397	334	new	warehouse	2026-03-25 08:50:45.599
398	334	warehouse	shipped	2026-03-25 08:50:47.124
399	336	new	warehouse	2026-03-25 08:51:34.412
400	336	warehouse	shipped	2026-03-25 08:51:35.958
401	337	new	archived	2026-03-25 09:02:53.295
402	341	new	archived	2026-03-25 09:20:11.685
403	343	new	warehouse	2026-03-25 09:20:48.126
404	343	warehouse	shipped	2026-03-25 09:20:49.629
405	344	new	warehouse	2026-03-25 09:21:23.421
406	344	warehouse	shipped	2026-03-25 09:21:24.84
407	345	new	warehouse	2026-03-25 09:21:51.769
408	345	warehouse	shipped	2026-03-25 09:21:53.205
409	346	new	warehouse	2026-03-25 09:22:18.878
410	346	warehouse	shipped	2026-03-25 09:22:20.137
411	350	new	warehouse	2026-03-25 09:22:52.623
412	350	warehouse	shipped	2026-03-25 09:22:55.083
413	351	new	warehouse	2026-03-25 09:23:35.219
414	351	warehouse	shipped	2026-03-25 09:23:36.715
415	352	new	warehouse	2026-03-25 09:23:49.331
416	352	warehouse	shipped	2026-03-25 09:23:50.873
417	353	new	warehouse	2026-03-25 09:24:21.535
418	353	warehouse	shipped	2026-03-25 09:24:23.031
419	354	new	warehouse	2026-03-25 09:25:08.424
420	354	warehouse	shipped	2026-03-25 09:25:09.839
421	355	new	warehouse	2026-03-25 09:27:26.327
422	355	warehouse	shipped	2026-03-25 09:27:28.053
423	357	new	warehouse	2026-03-25 09:28:38.431
424	357	warehouse	shipped	2026-03-25 09:28:40.465
425	358	new	warehouse	2026-03-25 09:28:52.602
426	358	warehouse	shipped	2026-03-25 09:28:53.863
427	401	new	done	2026-03-25 09:32:33.369
428	402	new	done	2026-03-25 09:35:02.687
429	337	archived	archived	2026-03-25 09:37:24.878
430	417	new	done	2026-03-25 09:41:43.473
431	404	new	done	2026-03-25 09:44:28.25
432	265	shipped	done	2026-03-25 09:45:35.814
433	418	new	done	2026-03-25 09:45:43.327
434	409	new	done	2026-03-25 09:48:30.644
435	370	new	warehouse	2026-03-25 10:10:59.553
436	370	warehouse	shipped	2026-03-25 10:11:00.927
437	371	new	warehouse	2026-03-25 10:11:39.837
438	371	warehouse	shipped	2026-03-25 10:11:41.137
439	414	new	done	2026-03-25 10:12:05.437
440	372	new	warehouse	2026-03-25 10:12:26.353
441	372	warehouse	shipped	2026-03-25 10:12:27.708
442	424	new	done	2026-03-25 10:13:18.894
443	373	new	warehouse	2026-03-25 10:14:40.121
444	373	warehouse	shipped	2026-03-25 10:14:42.106
445	374	new	warehouse	2026-03-25 10:15:12.224
446	374	warehouse	shipped	2026-03-25 10:15:13.975
447	376	new	warehouse	2026-03-25 10:18:51.258
448	376	warehouse	shipped	2026-03-25 10:18:52.679
449	377	new	warehouse	2026-03-25 10:19:22.627
450	377	warehouse	shipped	2026-03-25 10:19:24.252
451	378	new	warehouse	2026-03-25 10:19:40.875
452	378	warehouse	shipped	2026-03-25 10:19:42.308
453	379	new	warehouse	2026-03-25 10:20:06.701
454	379	warehouse	shipped	2026-03-25 10:20:08.371
455	380	new	warehouse	2026-03-25 10:21:04.566
456	380	warehouse	shipped	2026-03-25 10:21:05.811
457	382	new	warehouse	2026-03-25 10:21:34.731
458	382	warehouse	shipped	2026-03-25 10:21:36.141
459	387	new	warehouse	2026-03-25 10:22:31.732
460	387	warehouse	shipped	2026-03-25 10:22:33.111
461	389	new	warehouse	2026-03-25 10:24:26
462	389	warehouse	shipped	2026-03-25 10:24:28.145
463	390	new	warehouse	2026-03-25 10:25:16.304
464	390	warehouse	shipped	2026-03-25 10:25:17.562
465	399	new	warehouse	2026-03-25 10:26:10.599
466	399	warehouse	shipped	2026-03-25 10:26:12.1
467	413	new	warehouse	2026-03-25 10:29:04.416
468	413	warehouse	shipped	2026-03-25 10:29:05.899
469	421	new	warehouse	2026-03-25 10:29:47.124
470	421	warehouse	shipped	2026-03-25 10:29:48.602
471	422	new	warehouse	2026-03-25 10:31:03.87
472	422	warehouse	shipped	2026-03-25 10:31:05.92
473	423	new	warehouse	2026-03-25 10:31:24.435
474	423	warehouse	shipped	2026-03-25 10:31:25.723
475	425	new	warehouse	2026-03-25 10:31:54.307
476	425	warehouse	shipped	2026-03-25 10:31:56.218
477	427	new	warehouse	2026-03-25 10:32:07.352
478	427	warehouse	shipped	2026-03-25 10:32:08.725
479	405	new	done	2026-03-25 10:34:30.601
480	244	new	done	2026-03-25 10:35:37.142
481	284	new	done	2026-03-25 10:35:37.144
482	261	shipped	done	2026-03-25 10:35:37.146
483	286	warehouse	done	2026-03-25 10:35:37.148
484	295	shipped	done	2026-03-25 10:35:37.151
485	299	shipped	done	2026-03-25 10:35:37.154
486	307	new	done	2026-03-25 10:35:37.156
487	322	shipped	done	2026-03-25 10:35:37.158
488	324	shipped	done	2026-03-25 10:35:37.16
489	319	shipped	done	2026-03-25 10:35:37.161
490	313	warehouse	done	2026-03-25 10:35:37.163
491	312	shipped	done	2026-03-25 10:35:37.165
492	368	new	done	2026-03-25 10:35:37.168
493	359	new	done	2026-03-25 10:35:37.169
494	403	new	done	2026-03-25 10:35:37.171
495	408	warehouse	done	2026-03-25 10:35:37.173
496	428	new	done	2026-03-25 10:40:34.656
497	429	new	warehouse	2026-03-25 10:49:02.297
498	429	warehouse	shipped	2026-03-25 10:49:03.781
499	431	new	warehouse	2026-03-25 10:57:18.115
500	431	warehouse	shipped	2026-03-25 10:57:19.871
501	432	new	warehouse	2026-03-25 10:57:37.812
502	432	warehouse	shipped	2026-03-25 10:57:39.098
503	437	new	shipped	2026-03-25 14:36:43.489
504	436	new	shipped	2026-03-25 14:37:08.07
505	435	new	shipped	2026-03-25 14:37:25.682
506	426	new	shipped	2026-03-25 14:38:22.538
507	430	new	shipped	2026-03-25 14:39:20.205
508	415	new	shipped	2026-03-25 14:39:54.792
509	416	new	shipped	2026-03-25 14:40:18.15
510	419	new	shipped	2026-03-25 14:40:50.343
511	433	new	shipped	2026-03-25 14:41:11.77
512	441	new	done	2026-03-26 08:40:17.372
513	416	shipped	done	2026-03-26 08:40:32.03
514	447	new	done	2026-03-26 08:49:41.545
515	415	shipped	done	2026-03-26 08:51:30.497
516	434	new	warehouse	2026-03-26 09:41:53.185
517	434	warehouse	shipped	2026-03-26 09:41:54.509
518	438	new	warehouse	2026-03-26 09:42:25.737
519	438	warehouse	shipped	2026-03-26 09:42:27.53
520	439	new	warehouse	2026-03-26 09:43:18.907
521	439	warehouse	shipped	2026-03-26 09:43:20.449
522	440	new	warehouse	2026-03-26 09:43:35.857
523	440	warehouse	shipped	2026-03-26 09:43:37.272
524	420	new	warehouse	2026-03-26 09:50:11.248
525	420	warehouse	shipped	2026-03-26 09:50:13.092
526	412	new	warehouse	2026-03-26 09:50:25.808
527	412	warehouse	shipped	2026-03-26 09:50:27.352
528	410	new	warehouse	2026-03-26 10:04:04.731
529	410	warehouse	shipped	2026-03-26 10:04:06.436
530	442	new	archived	2026-03-26 10:13:03.626
531	340	new	warehouse	2026-03-26 10:22:17.648
532	340	warehouse	shipped	2026-03-26 10:22:18.963
533	356	new	warehouse	2026-03-26 10:22:36.463
534	356	warehouse	shipped	2026-03-26 10:22:37.682
535	435	shipped	done	2026-03-26 13:32:51.877
536	455	new	warehouse	2026-03-26 13:33:11.704
537	419	shipped	done	2026-03-26 13:33:44.895
538	448	new	warehouse	2026-03-26 13:33:57.457
539	446	new	warehouse	2026-03-26 13:34:42.025
540	456	new	warehouse	2026-03-26 13:35:27.943
541	457	new	warehouse	2026-03-26 13:36:07.177
542	453	new	warehouse	2026-03-26 13:40:39.642
543	451	new	warehouse	2026-03-26 13:41:04.99
544	458	new	done	2026-03-26 13:42:20.933
545	426	shipped	done	2026-03-26 13:43:10.142
546	459	new	shipped	2026-03-26 13:43:22.758
547	460	new	done	2026-03-26 13:47:04.802
548	461	new	shipped	2026-03-26 13:55:51.415
549	443	new	shipped	2026-03-26 13:56:37.305
550	445	new	done	2026-03-26 18:01:49.12
551	433	shipped	done	2026-03-26 18:02:49.578
552	437	shipped	done	2026-03-26 18:02:49.583
553	436	shipped	done	2026-03-26 18:02:49.588
554	455	warehouse	done	2026-03-26 18:02:49.593
555	430	shipped	done	2026-03-26 18:02:49.599
556	459	shipped	done	2026-03-26 18:02:49.603
557	448	warehouse	done	2026-03-26 18:02:49.607
558	446	warehouse	done	2026-03-26 18:02:49.613
559	456	warehouse	done	2026-03-26 18:02:49.616
560	457	warehouse	done	2026-03-26 18:02:49.618
561	453	warehouse	done	2026-03-26 18:02:49.62
562	451	warehouse	done	2026-03-26 18:02:49.622
563	461	shipped	done	2026-03-26 18:02:49.625
564	443	shipped	done	2026-03-26 18:02:49.627
565	476	new	archived	2026-03-27 10:40:16.238
566	482	new	archived	2026-03-27 11:55:01.229
567	483	new	archived	2026-03-27 12:04:12.881
568	444	new	warehouse	2026-03-27 12:11:51.771
569	444	warehouse	shipped	2026-03-27 12:11:53.708
570	484	new	archived	2026-03-27 12:13:59.166
571	471	new	warehouse	2026-03-27 12:16:30.52
572	471	warehouse	shipped	2026-03-27 12:16:31.985
573	485	new	warehouse	2026-03-27 12:20:26.932
574	485	warehouse	shipped	2026-03-27 12:20:28.318
575	486	new	archived	2026-03-27 12:23:37.608
576	475	new	warehouse	2026-03-27 12:28:29.315
577	479	new	warehouse	2026-03-27 12:28:55.867
578	450	new	warehouse	2026-03-27 13:07:35.835
579	450	warehouse	shipped	2026-03-27 13:07:37.423
580	452	new	warehouse	2026-03-27 13:09:16.564
581	452	warehouse	shipped	2026-03-27 13:09:18.93
582	472	new	warehouse	2026-03-27 13:10:28.158
583	472	warehouse	shipped	2026-03-27 13:10:29.683
584	470	new	warehouse	2026-03-27 13:11:27.102
585	470	warehouse	shipped	2026-03-27 13:11:28.559
586	449	new	warehouse	2026-03-27 13:12:36.337
587	449	warehouse	shipped	2026-03-27 13:12:37.717
588	478	new	warehouse	2026-03-27 13:13:53.766
589	478	warehouse	shipped	2026-03-27 13:13:55.187
590	469	new	warehouse	2026-03-27 13:18:45.321
591	469	warehouse	shipped	2026-03-27 13:18:46.701
592	473	new	warehouse	2026-03-27 13:19:38.218
593	473	warehouse	shipped	2026-03-27 13:19:39.643
594	474	new	warehouse	2026-03-27 13:19:55.07
595	474	warehouse	shipped	2026-03-27 13:19:56.697
596	488	new	warehouse	2026-03-27 13:24:46.838
597	468	new	archived	2026-03-27 13:24:55.797
598	467	new	warehouse	2026-03-27 13:25:21.577
599	465	new	warehouse	2026-03-27 13:25:39.401
600	465	warehouse	shipped	2026-03-27 13:25:40.671
601	477	new	warehouse	2026-03-27 13:25:46.643
602	454	new	warehouse	2026-03-27 13:27:20.483
603	454	warehouse	shipped	2026-03-27 13:27:21.936
604	464	new	warehouse	2026-03-27 13:34:31.155
605	464	warehouse	shipped	2026-03-27 13:34:33.422
606	492	new	warehouse	2026-03-27 13:41:48.724
607	492	warehouse	shipped	2026-03-27 13:41:50.166
608	494	new	warehouse	2026-03-27 14:02:44.099
609	495	new	shipped	2026-03-27 14:03:55.009
610	489	new	shipped	2026-03-27 14:04:34.3
611	475	warehouse	shipped	2026-03-27 14:05:12.718
612	479	warehouse	shipped	2026-03-27 14:05:12.721
613	488	warehouse	shipped	2026-03-27 14:05:12.724
614	467	warehouse	shipped	2026-03-27 14:05:12.726
615	477	warehouse	shipped	2026-03-27 14:05:12.728
616	491	new	shipped	2026-03-27 14:05:21.193
617	496	new	shipped	2026-03-27 14:08:32.655
618	494	warehouse	done	2026-03-27 18:14:00.161
619	491	shipped	done	2026-03-27 18:14:44.787
620	475	shipped	done	2026-03-27 18:14:44.79
621	495	shipped	done	2026-03-27 18:14:44.792
622	489	shipped	done	2026-03-27 18:14:44.795
623	479	shipped	done	2026-03-27 18:14:44.797
624	488	shipped	done	2026-03-27 18:14:44.799
625	467	shipped	done	2026-03-27 18:14:44.801
626	477	shipped	done	2026-03-27 18:14:44.803
627	496	shipped	done	2026-03-27 18:14:44.805
628	500	new	archived	2026-03-28 10:10:17.533
629	501	new	archived	2026-03-28 13:43:14.685
630	509	new	archived	2026-03-28 14:01:59.936
631	508	new	archived	2026-03-28 14:02:02.81
632	507	new	archived	2026-03-28 14:02:07.146
633	506	new	archived	2026-03-28 14:02:09.755
634	505	new	archived	2026-03-28 14:02:12.092
635	515	new	archived	2026-03-28 14:33:01.767
636	513	new	archived	2026-03-28 14:33:04.348
637	514	new	archived	2026-03-28 14:33:06.594
638	512	new	archived	2026-03-28 14:33:08.652
639	511	new	archived	2026-03-28 14:33:11.538
640	510	new	archived	2026-03-28 14:33:21.69
641	516	new	archived	2026-03-28 14:43:24.777
642	520	new	archived	2026-03-28 14:57:22.559
643	519	new	archived	2026-03-28 14:57:26.444
644	518	new	archived	2026-03-28 14:57:28.805
645	517	new	archived	2026-03-28 14:57:31.57
646	521	new	warehouse	2026-03-28 17:01:00.312
647	522	new	warehouse	2026-03-28 17:05:00.135
648	523	new	archived	2026-03-29 08:51:04.846
649	522	warehouse	new	2026-03-29 08:54:58.118
650	521	warehouse	archived	2026-03-29 10:41:34.673
651	526	new	warehouse	2026-03-29 10:50:52.77
652	528	new	archived	2026-03-29 16:27:23.82
653	529	new	warehouse	2026-03-29 16:31:34.473
654	526	warehouse	archived	2026-03-29 17:16:53.218
655	522	new	archived	2026-03-29 17:16:57.68
656	530	new	archived	2026-03-29 17:17:05.211
657	400	new	warehouse	2026-03-30 06:19:29.82
658	400	warehouse	shipped	2026-03-30 06:19:31.171
659	493	new	warehouse	2026-03-30 06:22:12.299
660	493	warehouse	shipped	2026-03-30 06:22:13.581
661	497	new	warehouse	2026-03-30 06:23:18.507
662	497	warehouse	shipped	2026-03-30 06:23:20.07
663	480	new	warehouse	2026-03-30 06:37:03.788
664	480	warehouse	shipped	2026-03-30 06:37:05.141
665	544	new	warehouse	2026-03-30 07:01:23.366
666	544	warehouse	archived	2026-03-30 09:10:45.529
667	529	warehouse	done	2026-03-30 09:10:54.879
668	490	new	done	2026-03-30 09:19:26.389
669	504	new	done	2026-03-30 09:23:20.607
670	502	new	done	2026-03-30 09:24:10.121
671	498	new	done	2026-03-30 09:24:30.872
672	564	new	done	2026-03-30 09:28:08.751
673	503	new	done	2026-03-30 09:29:03.214
674	499	new	done	2026-03-30 09:29:57.586
675	462	new	done	2026-03-30 09:30:57.641
676	565	new	done	2026-03-30 09:34:14.383
677	567	new	done	2026-03-30 09:36:23.496
678	569	new	done	2026-03-30 10:02:41.387
679	573	new	warehouse	2026-03-31 07:22:03.984
680	573	warehouse	shipped	2026-03-31 07:22:05.783
681	574	new	warehouse	2026-03-31 07:24:17.823
682	574	warehouse	shipped	2026-03-31 07:24:19.267
683	575	new	warehouse	2026-03-31 07:31:31.238
684	575	warehouse	shipped	2026-03-31 07:31:32.818
685	546	new	warehouse	2026-03-31 07:36:02.655
686	546	warehouse	shipped	2026-03-31 07:36:04.277
687	547	new	warehouse	2026-03-31 07:36:43.267
688	547	warehouse	shipped	2026-03-31 07:36:44.798
689	543	new	warehouse	2026-03-31 07:45:05.274
690	543	warehouse	shipped	2026-03-31 07:45:06.367
691	524	new	done	2026-03-31 07:45:08.543
692	454	shipped	done	2026-03-31 07:46:19.316
693	579	new	done	2026-03-31 07:46:38.453
694	590	new	done	2026-03-31 07:47:26.035
695	589	new	done	2026-03-31 07:48:02.379
696	578	new	done	2026-03-31 07:48:43.254
697	539	new	warehouse	2026-03-31 07:49:14.32
698	539	warehouse	shipped	2026-03-31 07:49:15.856
699	566	new	done	2026-03-31 08:00:37.026
700	551	new	done	2026-03-31 08:01:23.98
701	608	new	done	2026-03-31 08:02:24.889
702	545	new	done	2026-03-31 08:04:33.768
703	611	new	done	2026-03-31 08:05:30.354
704	613	new	done	2026-03-31 08:07:16.914
705	463	new	done	2026-03-31 08:07:43.421
706	605	new	warehouse	2026-03-31 08:07:55.087
707	605	warehouse	shipped	2026-03-31 08:07:56.632
708	606	new	warehouse	2026-03-31 08:09:39.663
709	606	warehouse	shipped	2026-03-31 08:09:41.29
710	612	new	warehouse	2026-03-31 08:15:51.972
711	612	warehouse	shipped	2026-03-31 08:15:53.439
712	615	new	archived	2026-03-31 08:18:29.16
713	570	new	done	2026-03-31 08:53:42.254
714	614	new	warehouse	2026-03-31 10:04:43.512
715	614	warehouse	archived	2026-03-31 10:04:59.284
716	598	new	warehouse	2026-03-31 10:37:27.222
717	598	warehouse	shipped	2026-03-31 10:37:28.852
718	597	new	warehouse	2026-03-31 10:37:58.378
719	597	warehouse	shipped	2026-03-31 10:37:59.984
720	568	new	warehouse	2026-03-31 10:55:03.392
721	568	warehouse	shipped	2026-03-31 10:55:04.949
722	465	shipped	done	2026-03-31 14:45:40.569
723	619	new	warehouse	2026-04-01 05:54:57.296
724	624	new	warehouse	2026-04-01 08:27:20.406
725	624	warehouse	shipped	2026-04-01 08:27:21.807
726	540	new	warehouse	2026-04-01 08:28:28.473
727	540	warehouse	shipped	2026-04-01 08:28:30.271
728	576	new	warehouse	2026-04-01 08:30:18.762
729	576	warehouse	shipped	2026-04-01 08:30:20.161
730	559	new	warehouse	2026-04-01 08:33:23.787
731	559	warehouse	shipped	2026-04-01 08:33:25.362
732	571	new	warehouse	2026-04-01 08:33:53.99
733	571	warehouse	shipped	2026-04-01 08:33:55.276
734	562	new	warehouse	2026-04-01 08:34:11.559
735	562	warehouse	shipped	2026-04-01 08:34:13.041
736	582	new	warehouse	2026-04-01 08:35:03.564
737	582	warehouse	shipped	2026-04-01 08:35:04.931
738	548	new	warehouse	2026-04-01 08:36:12.551
739	548	warehouse	shipped	2026-04-01 08:36:14.046
740	487	new	warehouse	2026-04-01 08:47:47.322
741	487	warehouse	shipped	2026-04-01 08:47:48.571
742	533	new	warehouse	2026-04-01 08:48:13.372
743	533	warehouse	shipped	2026-04-01 08:48:14.868
744	534	new	warehouse	2026-04-01 08:48:54.459
745	534	warehouse	shipped	2026-04-01 08:48:55.771
746	550	new	warehouse	2026-04-01 08:49:29.797
747	550	warehouse	shipped	2026-04-01 08:49:31.325
748	555	new	warehouse	2026-04-01 08:50:04.051
750	572	new	warehouse	2026-04-01 08:50:22.727
751	572	warehouse	shipped	2026-04-01 08:50:24.239
749	555	warehouse	shipped	2026-04-01 08:50:05.64
752	587	new	warehouse	2026-04-01 08:53:27.525
753	587	warehouse	shipped	2026-04-01 08:53:29.277
754	536	new	warehouse	2026-04-01 09:00:26.856
755	536	warehouse	shipped	2026-04-01 09:00:28.041
756	599	new	warehouse	2026-04-01 09:01:01.443
757	554	new	warehouse	2026-04-01 09:01:09.618
758	554	warehouse	shipped	2026-04-01 09:01:11.156
759	583	new	warehouse	2026-04-01 09:01:30.798
760	583	warehouse	shipped	2026-04-01 09:01:32.435
761	588	new	warehouse	2026-04-01 09:01:59.552
762	588	warehouse	shipped	2026-04-01 09:02:00.888
763	620	new	warehouse	2026-04-01 09:21:47.366
764	525	new	warehouse	2026-04-01 09:22:02.501
765	621	new	warehouse	2026-04-01 09:22:21.565
766	630	new	warehouse	2026-04-01 09:22:29.415
767	622	new	warehouse	2026-04-01 09:22:37.585
768	616	new	warehouse	2026-04-01 09:22:47.209
769	618	new	warehouse	2026-04-01 09:23:08.348
770	604	new	warehouse	2026-04-01 09:23:15.608
771	603	new	warehouse	2026-04-01 09:23:22.42
772	634	new	warehouse	2026-04-01 10:10:12.733
773	634	warehouse	shipped	2026-04-01 10:10:14.169
774	556	new	warehouse	2026-04-01 10:11:33.376
775	556	warehouse	shipped	2026-04-01 10:11:35.87
776	580	new	warehouse	2026-04-01 10:12:14.536
777	580	warehouse	shipped	2026-04-01 10:12:16.451
778	639	new	warehouse	2026-04-01 10:14:04.869
779	609	new	warehouse	2026-04-01 10:53:50.366
780	609	warehouse	shipped	2026-04-01 10:53:52.465
781	607	new	warehouse	2026-04-01 10:54:19.518
782	607	warehouse	shipped	2026-04-01 10:54:20.96
783	642	new	warehouse	2026-04-01 11:38:47.479
784	642	warehouse	shipped	2026-04-01 11:38:48.864
785	643	new	warehouse	2026-04-01 11:39:23.18
786	643	warehouse	shipped	2026-04-01 11:39:24.955
787	552	new	warehouse	2026-04-01 12:21:03.781
788	552	warehouse	shipped	2026-04-01 12:21:05.199
789	553	new	warehouse	2026-04-01 12:21:32.773
790	553	warehouse	shipped	2026-04-01 12:21:34.989
791	594	new	warehouse	2026-04-01 12:22:07.401
792	594	warehouse	shipped	2026-04-01 12:22:08.835
793	596	new	warehouse	2026-04-01 12:22:45.017
794	596	warehouse	shipped	2026-04-01 12:22:46.545
795	623	new	warehouse	2026-04-01 12:23:44.141
796	623	warehouse	shipped	2026-04-01 12:23:45.466
797	585	new	warehouse	2026-04-01 12:36:46.698
798	585	warehouse	shipped	2026-04-01 12:36:48.415
799	595	new	warehouse	2026-04-01 12:36:53.626
800	595	warehouse	shipped	2026-04-01 12:36:55.297
801	586	new	warehouse	2026-04-01 12:37:44.805
802	586	warehouse	shipped	2026-04-01 12:37:46.187
803	592	new	warehouse	2026-04-01 12:38:05.441
804	592	warehouse	shipped	2026-04-01 12:38:06.78
805	592	shipped	new	2026-04-01 12:38:41.331
806	593	new	warehouse	2026-04-01 12:38:49.516
807	593	warehouse	shipped	2026-04-01 12:38:50.949
808	542	new	warehouse	2026-04-01 12:39:14.822
809	542	warehouse	shipped	2026-04-01 12:39:16.003
810	584	new	warehouse	2026-04-01 12:53:18.667
811	584	warehouse	shipped	2026-04-01 12:53:20.07
812	549	new	warehouse	2026-04-01 12:59:26.575
813	549	warehouse	shipped	2026-04-01 12:59:28.474
814	638	new	warehouse	2026-04-01 13:00:17.132
815	558	new	warehouse	2026-04-01 13:01:06.214
816	558	warehouse	shipped	2026-04-01 13:01:08.541
817	577	new	warehouse	2026-04-01 13:02:00.677
818	577	warehouse	shipped	2026-04-01 13:02:02.076
819	581	new	warehouse	2026-04-01 13:02:12.736
820	581	warehouse	shipped	2026-04-01 13:02:14.241
821	538	new	warehouse	2026-04-01 13:03:23.346
822	538	warehouse	shipped	2026-04-01 13:03:24.797
823	527	new	warehouse	2026-04-01 13:04:42.658
824	527	warehouse	shipped	2026-04-01 13:04:44.079
825	561	new	warehouse	2026-04-01 13:04:57.872
826	561	warehouse	shipped	2026-04-01 13:04:59.483
827	563	new	warehouse	2026-04-01 13:05:11.896
828	563	warehouse	shipped	2026-04-01 13:05:13.492
829	617	new	warehouse	2026-04-01 13:06:58.311
830	617	warehouse	shipped	2026-04-01 13:06:59.961
831	636	new	archived	2026-04-01 13:07:27.815
832	537	new	warehouse	2026-04-01 13:08:05.353
833	537	warehouse	shipped	2026-04-01 13:08:06.95
834	531	new	warehouse	2026-04-01 13:08:31.898
835	531	warehouse	shipped	2026-04-01 13:08:33.783
836	532	new	warehouse	2026-04-01 13:09:45.337
837	532	warehouse	shipped	2026-04-01 13:09:46.868
838	541	new	warehouse	2026-04-01 13:10:24.874
839	541	warehouse	shipped	2026-04-01 13:10:26.795
840	557	new	warehouse	2026-04-01 13:11:09.503
841	557	warehouse	shipped	2026-04-01 13:11:10.903
842	560	new	warehouse	2026-04-01 13:11:35.885
843	560	warehouse	shipped	2026-04-01 13:11:37.766
844	644	new	warehouse	2026-04-01 13:45:51.75
845	641	new	warehouse	2026-04-01 13:45:59.411
846	637	new	warehouse	2026-04-01 13:46:06.06
847	645	new	warehouse	2026-04-01 13:55:22.505
848	639	warehouse	done	2026-04-01 15:04:21.793
849	640	new	done	2026-04-01 15:04:21.796
850	652	new	warehouse	2026-04-01 19:07:16.967
851	659	new	warehouse	2026-04-02 07:30:18.483
852	659	warehouse	shipped	2026-04-02 07:30:19.836
853	658	new	warehouse	2026-04-02 07:30:46.215
854	658	warehouse	shipped	2026-04-02 07:30:47.656
855	657	new	warehouse	2026-04-02 07:31:07.588
856	657	warehouse	shipped	2026-04-02 07:31:09.214
857	650	new	warehouse	2026-04-02 07:31:46.841
858	650	warehouse	shipped	2026-04-02 07:31:48.335
859	649	new	warehouse	2026-04-02 07:32:05.005
860	649	warehouse	shipped	2026-04-02 07:32:06.282
861	651	new	warehouse	2026-04-02 07:32:36.171
862	651	warehouse	shipped	2026-04-02 07:32:38.132
863	648	new	warehouse	2026-04-02 07:33:51.175
864	648	warehouse	shipped	2026-04-02 07:33:52.371
865	647	new	warehouse	2026-04-02 07:34:04.296
866	647	warehouse	shipped	2026-04-02 07:34:05.932
867	646	new	warehouse	2026-04-02 07:34:36.843
868	646	warehouse	shipped	2026-04-02 07:34:38.599
869	592	new	archived	2026-04-02 09:27:09.484
870	652	warehouse	done	2026-04-02 09:37:59.466
871	630	warehouse	done	2026-04-02 09:38:29.143
872	645	warehouse	done	2026-04-02 09:38:52.578
873	525	warehouse	done	2026-04-02 09:40:30.53
874	616	warehouse	done	2026-04-02 09:41:39.993
875	666	new	done	2026-04-02 09:42:11.928
876	604	warehouse	done	2026-04-02 09:42:47.453
877	638	warehouse	done	2026-04-02 09:43:00.533
878	622	warehouse	done	2026-04-02 09:44:37.41
879	644	warehouse	done	2026-04-02 09:44:56.009
880	624	shipped	done	2026-04-02 09:45:28.068
881	641	warehouse	done	2026-04-02 09:51:29.214
882	603	warehouse	done	2026-04-02 09:51:59.964
883	637	warehouse	done	2026-04-02 09:52:09.064
884	620	warehouse	done	2026-04-02 09:52:50.684
885	635	new	done	2026-04-02 09:52:57.926
886	621	warehouse	done	2026-04-02 09:54:44.928
887	619	warehouse	done	2026-04-02 09:55:15.545
888	599	warehouse	done	2026-04-02 09:55:48.956
889	618	warehouse	done	2026-04-02 09:56:37.93
890	667	new	done	2026-04-02 10:01:15.147
891	668	new	done	2026-04-02 10:03:24.092
892	672	new	done	2026-04-02 10:41:32.51
893	674	new	done	2026-04-02 11:09:44.19
894	675	new	done	2026-04-02 11:11:18.446
895	682	new	warehouse	2026-04-02 12:43:14.879
896	682	warehouse	new	2026-04-02 12:53:17.261
897	600	new	warehouse	2026-04-02 12:54:40.377
898	673	new	warehouse	2026-04-02 13:25:13.919
899	673	warehouse	shipped	2026-04-02 13:25:15.638
900	682	new	warehouse	2026-04-02 13:42:02.008
901	661	new	warehouse	2026-04-02 13:42:18.63
902	660	new	warehouse	2026-04-02 13:42:24.852
903	653	new	warehouse	2026-04-02 13:42:41.67
904	665	new	warehouse	2026-04-02 13:43:47.188
905	682	warehouse	done	2026-04-02 16:09:09.925
906	665	warehouse	done	2026-04-02 16:10:43.445
907	661	warehouse	done	2026-04-02 16:13:38.531
908	660	warehouse	done	2026-04-02 16:19:39.355
909	688	new	done	2026-04-02 16:25:15.869
910	600	warehouse	done	2026-04-02 16:28:15.286
911	689	new	done	2026-04-02 16:30:24.108
912	690	new	warehouse	2026-04-02 16:33:49.693
913	690	shipped	archived	2026-04-02 16:34:07.445
914	692	new	archived	2026-04-02 16:59:16.166
915	691	new	archived	2026-04-02 16:59:25.377
916	466	new	warehouse	2026-04-03 12:00:02.061
917	466	warehouse	shipped	2026-04-03 12:00:03.391
918	678	new	warehouse	2026-04-03 12:02:33.921
919	678	warehouse	shipped	2026-04-03 12:02:35.315
920	678	shipped	new	2026-04-03 12:02:39.344
921	678	new	warehouse	2026-04-03 12:02:56.907
922	678	warehouse	shipped	2026-04-03 12:02:58.155
923	535	new	warehouse	2026-04-03 12:05:48.682
924	535	warehouse	shipped	2026-04-03 12:05:50.353
925	679	new	warehouse	2026-04-03 12:06:44.66
926	679	warehouse	shipped	2026-04-03 12:06:45.958
927	610	new	warehouse	2026-04-03 12:09:28.81
928	610	warehouse	shipped	2026-04-03 12:09:30.589
929	626	new	warehouse	2026-04-03 12:11:16.214
930	626	warehouse	shipped	2026-04-03 12:11:18.377
931	655	new	warehouse	2026-04-03 12:12:23.53
932	655	warehouse	shipped	2026-04-03 12:12:25.041
933	664	new	warehouse	2026-04-03 12:12:36.571
934	664	warehouse	shipped	2026-04-03 12:12:37.948
935	686	new	archived	2026-04-03 12:14:13.936
936	656	new	warehouse	2026-04-03 12:14:54.804
937	656	warehouse	shipped	2026-04-03 12:14:57.333
938	671	new	warehouse	2026-04-03 12:15:43.381
939	671	warehouse	shipped	2026-04-03 12:15:44.783
940	698	new	warehouse	2026-04-03 12:16:44.876
941	698	warehouse	shipped	2026-04-03 12:16:46.432
942	705	new	warehouse	2026-04-03 12:17:44.773
943	705	warehouse	shipped	2026-04-03 12:17:46.204
944	629	new	warehouse	2026-04-03 12:18:22.733
945	629	warehouse	shipped	2026-04-03 12:18:24.267
946	632	new	warehouse	2026-04-03 12:18:45.672
947	632	warehouse	shipped	2026-04-03 12:18:46.927
948	663	new	archived	2026-04-03 12:21:20.248
949	683	new	warehouse	2026-04-03 12:21:59.604
950	683	warehouse	shipped	2026-04-03 12:22:01.292
951	685	new	warehouse	2026-04-03 12:22:15.344
952	685	warehouse	shipped	2026-04-03 12:22:16.98
953	697	new	warehouse	2026-04-03 12:23:28.243
954	697	warehouse	shipped	2026-04-03 12:23:29.504
955	684	new	warehouse	2026-04-03 12:23:55.834
956	684	warehouse	shipped	2026-04-03 12:23:57.079
957	662	new	warehouse	2026-04-03 12:25:20.988
958	662	warehouse	shipped	2026-04-03 12:25:22.691
959	669	new	archived	2026-04-03 12:25:50.207
960	670	new	warehouse	2026-04-03 12:25:55.699
961	670	warehouse	shipped	2026-04-03 12:25:56.923
962	708	new	done	2026-04-03 12:26:10.286
963	677	new	warehouse	2026-04-03 12:26:55.861
964	677	warehouse	shipped	2026-04-03 12:26:57.375
965	633	new	warehouse	2026-04-03 12:28:37.618
966	633	warehouse	shipped	2026-04-03 12:28:39.28
967	653	warehouse	done	2026-04-03 12:41:42.883
968	654	new	done	2026-04-03 15:19:03.413
969	720	new	archived	2026-04-04 11:07:34.369
970	719	new	archived	2026-04-04 11:07:38.588
971	718	new	archived	2026-04-04 11:09:40.827
972	699	new	warehouse	2026-04-04 13:16:42.727
973	724	new	warehouse	2026-04-04 13:16:57.908
974	722	new	warehouse	2026-04-04 13:17:21.712
975	716	new	warehouse	2026-04-04 13:17:44.073
976	715	new	warehouse	2026-04-04 13:17:56.069
977	707	new	warehouse	2026-04-04 13:18:29.388
978	721	new	warehouse	2026-04-04 15:38:52.084
979	713	new	warehouse	2026-04-04 15:38:59.981
980	717	new	warehouse	2026-04-04 15:39:57.622
981	714	new	warehouse	2026-04-04 15:40:09.43
982	601	new	warehouse	2026-04-04 15:40:32.724
983	736	new	warehouse	2026-04-06 06:56:57.409
984	736	warehouse	shipped	2026-04-06 06:56:58.983
985	745	new	warehouse	2026-04-06 07:40:58.594
986	745	warehouse	shipped	2026-04-06 07:41:00.035
987	695	new	warehouse	2026-04-06 08:55:05.57
988	676	new	warehouse	2026-04-06 08:55:27.549
989	701	new	warehouse	2026-04-06 08:56:05.229
990	700	new	warehouse	2026-04-06 08:56:12.627
991	704	new	warehouse	2026-04-06 08:56:25.463
992	709	new	warehouse	2026-04-06 08:56:33.724
993	710	new	warehouse	2026-04-06 08:56:41.489
994	710	warehouse	done	2026-04-06 09:07:51.47
995	709	warehouse	done	2026-04-06 09:08:38.341
996	751	new	warehouse	2026-04-06 09:08:38.822
997	722	warehouse	done	2026-04-06 09:09:12.816
998	707	warehouse	done	2026-04-06 09:09:52.28
999	704	warehouse	done	2026-04-06 09:10:20.721
1000	400	shipped	done	2026-04-06 09:10:51.712
1001	701	warehouse	done	2026-04-06 09:11:21.481
1002	700	warehouse	done	2026-04-06 09:12:55.104
1003	717	warehouse	done	2026-04-06 09:13:06.732
1004	206	new	warehouse	2026-04-06 09:13:31.158
1005	481	new	warehouse	2026-04-06 09:13:41.209
1006	591	new	warehouse	2026-04-06 09:14:34.811
1007	742	new	warehouse	2026-04-06 09:18:12.75
1008	699	warehouse	archived	2026-04-06 09:18:42.661
1009	715	warehouse	done	2026-04-06 09:19:48.054
1010	695	warehouse	done	2026-04-06 09:20:48.045
1011	714	warehouse	done	2026-04-06 09:21:17.667
1012	713	warehouse	done	2026-04-06 09:22:18.693
1013	748	new	warehouse	2026-04-06 09:24:58.722
1014	747	new	warehouse	2026-04-06 09:25:38.089
1015	729	new	warehouse	2026-04-06 09:26:31.203
1016	721	warehouse	done	2026-04-06 09:28:45.3
1017	726	new	warehouse	2026-04-06 09:28:59.076
1018	753	new	done	2026-04-06 09:30:45.131
1019	754	new	done	2026-04-06 09:49:11.142
1020	601	warehouse	done	2026-04-06 09:59:06.332
1021	602	new	done	2026-04-06 09:59:23.709
1022	758	new	done	2026-04-06 10:06:31.396
1023	759	new	done	2026-04-06 10:08:08.384
1024	760	new	done	2026-04-06 10:09:16.291
1025	734	new	warehouse	2026-04-06 10:20:19.419
1026	733	new	warehouse	2026-04-06 10:22:38.83
1027	732	new	warehouse	2026-04-06 10:23:01.14
1028	731	new	warehouse	2026-04-06 10:23:44.205
1029	206	warehouse	archived	2026-04-06 10:31:16.373
1030	755	new	warehouse	2026-04-06 10:39:07.822
1031	757	new	warehouse	2026-04-06 10:49:47.797
1032	756	new	warehouse	2026-04-06 10:50:06.997
1033	730	new	warehouse	2026-04-06 12:05:45.116
1034	735	new	warehouse	2026-04-06 13:05:07.947
1035	767	new	warehouse	2026-04-06 13:48:27.083
1036	765	new	warehouse	2026-04-06 13:49:28.921
1037	741	new	warehouse	2026-04-06 13:49:38.519
1038	749	new	warehouse	2026-04-06 13:49:47.418
1039	703	new	warehouse	2026-04-06 17:37:39.242
1040	727	new	warehouse	2026-04-06 17:38:29.627
1041	750	new	warehouse	2026-04-07 07:32:33.32
1042	737	new	warehouse	2026-04-07 07:35:08.67
1043	764	new	warehouse	2026-04-07 08:02:22.077
1044	763	new	warehouse	2026-04-07 08:02:45.203
1045	762	new	warehouse	2026-04-07 08:03:08.239
1046	792	new	warehouse	2026-04-07 13:28:28.489
1047	783	new	warehouse	2026-04-07 13:29:25.486
1048	785	new	warehouse	2026-04-07 13:30:55.017
1049	794	new	warehouse	2026-04-07 13:32:31.574
1050	795	new	warehouse	2026-04-07 13:36:18.469
1051	627	new	warehouse	2026-04-08 07:55:53.882
1052	627	warehouse	shipped	2026-04-08 07:55:55.128
1053	725	new	done	2026-04-08 08:52:09.983
1054	805	new	done	2026-04-08 08:55:46.734
1055	809	new	done	2026-04-08 10:10:06.458
1088	842	new	done	2026-04-08 10:24:52.991
1089	806	new	warehouse	2026-04-08 11:12:27.092
1090	806	warehouse	shipped	2026-04-08 11:12:28.585
1091	809	done	archived	2026-04-08 11:33:28.967
1092	847	new	done	2026-04-08 11:42:29.648
1093	772	new	archived	2026-04-08 11:58:57.501
1094	848	new	archived	2026-04-08 11:59:06.595
1095	845	new	archived	2026-04-08 11:59:09.923
1096	844	new	archived	2026-04-08 11:59:12.875
1097	846	new	archived	2026-04-08 11:59:15.318
1099	780	new	archived	2026-04-08 11:59:27.238
1098	781	new	archived	2026-04-08 11:59:23.979
1100	779	new	archived	2026-04-08 11:59:29.576
1101	778	new	archived	2026-04-08 11:59:31.847
1102	777	new	archived	2026-04-08 11:59:33.976
1103	774	new	archived	2026-04-08 11:59:37.097
1104	773	new	archived	2026-04-08 11:59:39.544
1105	852	new	done	2026-04-08 12:20:56.375
1106	853	new	done	2026-04-08 12:47:52.802
1107	796	new	warehouse	2026-04-08 13:15:33.019
1108	852	done	archived	2026-04-08 14:03:13.805
1109	851	new	archived	2026-04-08 14:03:16.937
1110	850	new	archived	2026-04-08 14:03:19.975
1111	768	new	warehouse	2026-04-09 06:11:27.367
1112	860	new	warehouse	2026-04-09 08:04:41.074
1113	860	warehouse	shipped	2026-04-09 08:05:15.752
1114	796	warehouse	done	2026-04-09 08:39:35.61
1115	866	new	done	2026-04-09 08:41:49.925
1116	867	new	done	2026-04-09 08:43:01.175
1117	868	new	done	2026-04-09 08:45:15.713
1118	795	warehouse	done	2026-04-09 09:16:17.588
1119	794	warehouse	done	2026-04-09 09:19:07.362
1120	792	warehouse	done	2026-04-09 09:23:26.93
1121	869	new	done	2026-04-09 09:26:31.109
1122	849	new	done	2026-04-09 09:29:43.361
1123	843	new	done	2026-04-09 09:33:08.602
1124	797	new	done	2026-04-09 09:33:35.317
1125	767	warehouse	done	2026-04-09 09:33:52.832
1126	803	new	done	2026-04-09 09:35:26.293
1127	782	new	done	2026-04-09 09:35:42.297
1128	741	warehouse	done	2026-04-09 09:36:54.673
1129	808	new	done	2026-04-09 09:37:43.847
1130	752	new	done	2026-04-09 09:38:49.974
1131	765	warehouse	done	2026-04-09 09:40:22.612
1132	761	new	warehouse	2026-04-09 10:19:15.555
1133	761	warehouse	shipped	2026-04-09 10:19:16.853
1134	791	new	warehouse	2026-04-09 10:21:05.176
1135	791	warehouse	shipped	2026-04-09 10:21:06.725
1136	787	new	warehouse	2026-04-09 10:22:51.906
1137	787	warehouse	shipped	2026-04-09 10:22:53.558
1138	770	new	warehouse	2026-04-09 10:23:00.976
1139	770	warehouse	shipped	2026-04-09 10:23:02.451
1140	763	warehouse	shipped	2026-04-09 10:23:18.839
1141	711	new	warehouse	2026-04-09 10:23:30.516
1142	711	warehouse	shipped	2026-04-09 10:23:31.694
1143	793	new	warehouse	2026-04-09 10:26:23.92
1144	793	warehouse	shipped	2026-04-09 10:26:25.372
1145	784	new	warehouse	2026-04-09 10:27:41.43
1146	784	warehouse	shipped	2026-04-09 10:27:43.28
1147	764	warehouse	shipped	2026-04-09 10:28:11.478
1148	790	new	warehouse	2026-04-09 10:29:08.904
1149	790	warehouse	shipped	2026-04-09 10:29:10.51
1150	751	warehouse	shipped	2026-04-09 10:29:21.733
1151	681	new	warehouse	2026-04-09 10:29:57.967
1152	681	warehouse	shipped	2026-04-09 10:29:59.414
1153	726	warehouse	shipped	2026-04-09 10:32:05.241
1154	775	new	warehouse	2026-04-09 10:50:36.735
1155	775	warehouse	shipped	2026-04-09 10:50:37.782
1156	776	new	warehouse	2026-04-09 10:51:17.607
1157	776	warehouse	shipped	2026-04-09 10:51:19.195
1158	762	warehouse	shipped	2026-04-09 10:51:45.329
1159	729	warehouse	shipped	2026-04-09 10:52:06.816
1160	696	new	warehouse	2026-04-09 10:53:07.662
1161	696	warehouse	shipped	2026-04-09 10:53:08.966
1162	481	warehouse	shipped	2026-04-09 10:54:07.699
1163	723	new	warehouse	2026-04-09 10:56:02.272
1164	723	warehouse	shipped	2026-04-09 10:56:03.771
1165	703	warehouse	shipped	2026-04-09 11:00:52.685
1166	786	new	warehouse	2026-04-09 11:01:07.531
1167	786	warehouse	shipped	2026-04-09 11:01:08.772
1168	865	new	warehouse	2026-04-09 11:17:20.875
1169	879	new	warehouse	2026-04-09 12:44:14.282
1170	881	new	warehouse	2026-04-09 12:48:12.782
1171	882	new	done	2026-04-09 12:59:39.693
1172	883	new	warehouse	2026-04-09 13:02:35.984
1173	878	new	warehouse	2026-04-09 13:03:20.265
1174	870	new	warehouse	2026-04-09 13:06:48.651
1175	884	new	warehouse	2026-04-09 13:07:41.208
1176	873	new	warehouse	2026-04-09 13:08:15.856
1177	885	new	warehouse	2026-04-09 13:20:59.362
1178	886	new	warehouse	2026-04-09 13:21:38.969
1179	887	new	warehouse	2026-04-09 13:29:58.698
1180	880	new	warehouse	2026-04-09 13:30:34.991
1181	888	new	warehouse	2026-04-09 13:31:51.941
1182	889	new	warehouse	2026-04-09 13:36:34.979
1183	877	new	done	2026-04-09 13:42:12.295
1184	749	warehouse	done	2026-04-09 13:55:08.031
1185	785	warehouse	done	2026-04-09 13:55:15.806
1186	804	new	done	2026-04-09 13:55:20.865
1187	861	new	done	2026-04-09 13:55:54.584
1188	895	new	warehouse	2026-04-10 07:36:57.33
1189	895	warehouse	shipped	2026-04-10 07:37:10.653
1190	766	new	warehouse	2026-04-10 08:17:38.407
1191	766	warehouse	shipped	2026-04-10 08:17:47.098
1192	734	warehouse	shipped	2026-04-10 08:19:18.89
1193	712	new	warehouse	2026-04-10 08:20:00.801
1194	712	warehouse	shipped	2026-04-10 08:20:13.827
1195	800	new	warehouse	2026-04-10 08:22:04.166
1196	800	warehouse	shipped	2026-04-10 08:22:35.316
1197	748	warehouse	shipped	2026-04-10 08:22:56.937
1198	744	new	warehouse	2026-04-10 08:23:45.023
1199	744	warehouse	shipped	2026-04-10 08:23:57.814
1200	680	new	warehouse	2026-04-10 08:25:23.982
1201	680	warehouse	shipped	2026-04-10 08:25:51.033
1202	628	new	warehouse	2026-04-10 08:28:38.705
1203	802	new	warehouse	2026-04-10 08:33:46.89
1204	802	warehouse	shipped	2026-04-10 08:34:13.764
1205	757	warehouse	shipped	2026-04-10 08:36:06.464
1206	733	warehouse	shipped	2026-04-10 08:39:40.17
1207	771	new	warehouse	2026-04-10 08:41:34.265
1208	771	warehouse	shipped	2026-04-10 08:41:47.198
1209	756	warehouse	shipped	2026-04-10 08:42:20.398
1210	755	warehouse	shipped	2026-04-10 08:44:39.621
1211	731	warehouse	shipped	2026-04-10 08:47:07.273
1212	728	new	warehouse	2026-04-10 08:47:49.462
1213	728	warehouse	shipped	2026-04-10 08:48:01.607
1214	898	new	done	2026-04-10 08:48:08.516
1215	702	new	warehouse	2026-04-10 08:49:20.726
1216	702	warehouse	shipped	2026-04-10 08:49:35.461
1217	625	new	warehouse	2026-04-10 08:50:01.347
1218	625	warehouse	shipped	2026-04-10 08:50:13.365
1219	769	new	warehouse	2026-04-10 08:52:40.716
1220	769	warehouse	shipped	2026-04-10 08:52:55.473
1221	747	warehouse	shipped	2026-04-10 08:53:38.496
1222	743	new	warehouse	2026-04-10 08:54:14.755
1223	743	warehouse	shipped	2026-04-10 08:54:26.938
1224	886	warehouse	done	2026-04-10 08:55:01.505
1225	885	warehouse	done	2026-04-10 08:55:05.336
1226	874	new	done	2026-04-10 08:55:09.599
1227	732	warehouse	shipped	2026-04-10 08:56:20.42
1228	730	warehouse	shipped	2026-04-10 08:56:57.284
1229	727	warehouse	shipped	2026-04-10 08:57:42.048
1230	706	new	warehouse	2026-04-10 08:59:21.053
1231	706	warehouse	shipped	2026-04-10 08:59:33.451
1232	693	new	warehouse	2026-04-10 09:00:47.804
1233	693	warehouse	shipped	2026-04-10 09:01:00.571
1234	870	warehouse	done	2026-04-10 09:03:02.793
1235	746	new	warehouse	2026-04-10 09:04:33.689
1236	746	warehouse	shipped	2026-04-10 09:04:52.458
1237	801	new	done	2026-04-10 09:10:30.547
1238	783	warehouse	done	2026-04-10 09:11:51.056
1239	737	warehouse	done	2026-04-10 09:22:14.912
1240	884	warehouse	done	2026-04-10 09:47:56.888
1241	901	new	warehouse	2026-04-10 12:39:17.552
1242	901	warehouse	done	2026-04-10 12:39:30.361
1243	900	new	warehouse	2026-04-10 12:39:48.715
1244	900	warehouse	shipped	2026-04-10 12:40:01.603
1245	897	new	warehouse	2026-04-10 12:40:36.709
1246	897	warehouse	shipped	2026-04-10 12:40:58.564
1247	894	new	warehouse	2026-04-10 12:42:20.18
1248	894	warehouse	shipped	2026-04-10 12:42:22.036
1249	890	new	warehouse	2026-04-10 12:42:46.266
1250	890	warehouse	shipped	2026-04-10 12:42:48.049
1251	875	new	warehouse	2026-04-10 12:45:07.026
1252	875	warehouse	shipped	2026-04-10 12:45:08.888
1253	855	new	done	2026-04-10 12:45:36.797
1254	799	new	warehouse	2026-04-10 12:46:07.838
1255	799	warehouse	shipped	2026-04-10 12:46:49.54
1256	789	new	warehouse	2026-04-10 12:47:44.348
1257	789	warehouse	shipped	2026-04-10 12:48:10.806
1258	738	new	warehouse	2026-04-10 12:49:07.123
1259	738	warehouse	new	2026-04-10 12:49:21.513
1260	891	new	warehouse	2026-04-10 12:52:06.672
1261	891	warehouse	shipped	2026-04-10 12:52:18.956
1262	863	new	warehouse	2026-04-10 12:54:19.738
1263	863	warehouse	shipped	2026-04-10 12:54:32.928
1264	858	new	warehouse	2026-04-10 12:55:13.68
1265	858	warehouse	shipped	2026-04-10 12:55:26.445
1266	854	new	warehouse	2026-04-10 12:55:55.855
1267	854	warehouse	shipped	2026-04-10 12:56:08.69
1268	798	new	warehouse	2026-04-10 12:56:46.83
1269	798	warehouse	shipped	2026-04-10 12:56:48.51
1270	694	new	warehouse	2026-04-10 12:57:08.818
1271	694	warehouse	shipped	2026-04-10 12:57:20.946
1272	893	new	warehouse	2026-04-10 12:59:06.948
1273	893	warehouse	shipped	2026-04-10 12:59:08.518
1274	876	new	warehouse	2026-04-10 12:59:32.3
1275	876	warehouse	shipped	2026-04-10 12:59:57.884
1276	864	new	warehouse	2026-04-10 13:00:54.603
1277	864	warehouse	shipped	2026-04-10 13:01:06.943
1278	788	new	warehouse	2026-04-10 13:02:07.21
1279	788	warehouse	shipped	2026-04-10 13:02:24.147
1280	739	new	warehouse	2026-04-10 13:03:19.815
1281	739	warehouse	shipped	2026-04-10 13:03:34.772
1282	879	warehouse	shipped	2026-04-10 13:04:21.056
1283	908	new	warehouse	2026-04-10 13:23:12.962
1284	908	warehouse	shipped	2026-04-10 13:23:26.179
1285	909	new	archived	2026-04-10 16:35:59.567
1286	857	new	archived	2026-04-10 16:36:11.807
1287	856	new	archived	2026-04-10 16:36:16.102
1288	910	new	archived	2026-04-10 17:09:17.741
1289	916	new	shipped	2026-04-11 13:17:00.852
1290	919	new	warehouse	2026-04-11 13:17:17.239
1291	919	warehouse	shipped	2026-04-11 13:17:23.588
1292	918	new	warehouse	2026-04-11 13:50:14.02
1293	917	new	warehouse	2026-04-11 13:51:40.454
1294	904	new	warehouse	2026-04-11 13:52:22.1
1295	921	new	warehouse	2026-04-11 13:54:56.211
1296	921	warehouse	archived	2026-04-11 13:55:23.915
1297	922	new	warehouse	2026-04-11 13:56:21.884
1298	917	warehouse	shipped	2026-04-11 13:56:50.161
1299	918	warehouse	shipped	2026-04-11 13:56:50.163
1300	922	warehouse	shipped	2026-04-11 13:56:50.165
1301	923	new	archived	2026-04-12 18:08:01.825
\.


--
-- Data for Name: service_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_prices (id, name, price, unit, comment, created_at, updated_at) FROM stdin;
3	Хранение от куба	80	руб./день	до 7 дней бесплатно	2026-02-26 20:20:40.932	2026-02-26 20:20:40.932
4	Хранение до куба	50	руб./день	до 7 дней бесплатно	2026-02-26 20:20:40.932	2026-02-26 20:20:40.932
11	Выгрузка/Cборка	200	рублей	Выгрузка россыпью паллеты, затем сборка.	2026-02-27 10:00:27.729	2026-02-27 10:02:46.824
12	Помощь на выгрузке	10	рублей	Выгрузка за каждую коробку до 5 коробок	2026-02-27 10:03:53.456	2026-02-27 10:09:50.868
1	Забор груза с адреса до 80 коробов (8 м³)	1350	руб.	\N	2026-02-26 20:20:40.932	2026-02-27 10:13:02.561
9	Гофрокартон 60х40х40 (б/у 5ти слойные)	60	руб.	60р	2026-02-26 20:20:40.932	2026-03-16 05:19:40.412
5	Распечатка (шк коробов или поставки)	10	руб.	за штуку	2026-02-26 20:20:40.932	2026-03-16 05:20:07.554
13	Помощь на выгрузке от 0.6м³до 1м³	100	рублей	Выгрузка за каждую коробку от 0.5 м³до 1м³	2026-02-27 10:08:40.062	2026-03-16 10:00:59.388
10	Забор груза с адреса до 12 коробок или до (1 м³)	500	руб	Автомобиль меньшего размера типо лада "ларгус"	2026-02-27 09:59:59.736	2026-03-19 12:25:25.824
14	Распечатка упаковочного листа паллеты	50	шт	Лист А4 размера	2026-03-16 05:20:24.946	2026-03-19 12:25:45.145
7	Скотч 150м	100	руб.	за штуку	2026-02-26 20:20:40.932	2026-03-19 12:25:53.264
8	Термоэтикетка 58х40 (600 этикеток в рулоне)	100	руб.	за штуку	2026-02-26 20:20:40.932	2026-03-19 12:25:59.412
15	Помощь на выгрузке	10	шт	фбс за 0.1 куба	2026-03-19 14:39:56.325	2026-03-19 14:39:56.325
2	Паллетирование	275	руб.	\N	2026-02-26 20:20:40.932	2026-03-25 09:30:32.041
6	Предоставление деревянного поддона	375	руб.	за штуку	2026-02-26 20:20:40.932	2026-03-25 09:31:01.931
16	Упаковка товара	5	ед	\N	2026-03-27 12:48:14.416	2026-03-27 14:19:17.514
\.


--
-- Data for Name: shipment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipment_requests (id, client_id, city, delivery_date, size, weight, box_count, comment, status, created_at, updated_at, volume, packaging_type, city_id, box_type_id, is_read, delivery_type_id, mp_account_date) FROM stdin;
237	186	WB Курск	2026-03-25 00:00:00	-	\N	3	\N	archived	2026-03-18 08:15:28.501	2026-03-18 09:06:43.307	\N	boxes	2	\N	t	\N	\N
255	270	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 11:00:22.909	2026-03-18 13:32:20.004	\N	boxes	1	\N	t	1	\N
230	237	WB Воронеж	2026-03-18 00:00:00	-	\N	1	1. Большая x1 = 850₽ | Итого: 850₽	shipped	2026-03-17 12:00:58.051	2026-03-17 15:49:41.734	\N	boxes	7	3	t	2	2026-03-18 00:00:00
248	262	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 08:58:30.188	2026-03-19 13:30:32.988	\N	boxes	1	\N	t	1	\N
216	223	WB Коледино	2026-03-25 00:00:00	-	\N	110000	1. Средняя x110000 = 93500000₽ | Итого: 93500000₽	archived	2026-03-16 16:36:44.771	2026-03-16 16:46:41.791	\N	boxes	12	2	t	2	2026-03-16 00:00:00
166	188	WB Курск	2026-03-21 00:00:00	-	\N	5	1. 301–400 x5 = 30000₽ | Итого: 30000₽	archived	2026-03-12 13:08:47.995	2026-03-16 18:57:30.827	\N	pallets	2	\N	t	\N	\N
206	269	WB Екатеринбург	2026-03-23 00:00:00	-	\N	2	1. Средняя x2 = 2200₽ | Итого: 2200₽	archived	2026-03-16 11:02:33.669	2026-04-06 10:31:16.369	\N	boxes	13	2	t	\N	2026-03-23 00:00:00
189	223	WB Волгоград	2026-03-20 00:00:00	-	\N	2	1. 301–400 x2 = 0₽ | Итого: 0₽	archived	2026-03-15 16:41:53.336	2026-03-16 18:57:51.772	\N	pallets	9	\N	t	1	\N
190	223	WB Волгоград	2026-03-20 00:00:00	-	\N	2	1. Средняя x2 = 0₽ | Итого: 0₽	archived	2026-03-15 16:42:00.702	2026-03-16 18:57:56.367	\N	boxes	9	2	t	2	\N
215	285	WB Электросталь	2026-03-18 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-16 14:32:36.756	2026-03-20 13:28:00.591	\N	boxes	17	3	t	2	2026-03-18 00:00:00
169	192	WB Казань	2026-03-27 00:00:00	-	\N	1	1. Маленькая x1 = 0₽ | Итого: 0₽	archived	2026-03-13 06:32:05.898	2026-03-16 19:04:41.277	\N	boxes	5	1	t	\N	\N
185	192	WB Екатеринбург	2026-03-30 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 0₽ | Итого: 0₽	archived	2026-03-13 19:25:57.295	2026-03-16 19:04:55.604	\N	boxes	13	83	t	\N	\N
209	273	WB Новосемейкино	2026-03-19 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5500₽ | Итого: 5500₽	shipped	2026-03-16 11:45:30.576	2026-03-20 12:08:16.939	\N	boxes	16	83	t	2	2026-03-19 00:00:00
196	223	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.43 = 860₽ | Итого: 860₽	archived	2026-03-15 20:34:36.176	2026-03-16 16:19:13.814	\N	boxes	1	\N	t	1	2026-03-26 00:00:00
193	186	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	archived	2026-03-15 19:06:26.255	2026-03-16 16:19:44.516	\N	boxes	1	\N	t	1	2026-03-16 00:00:00
188	186	WB Волгоград	2026-03-27 00:00:00	-	\N	7	1. Большая x7 = 0₽ | Итого: 0₽	archived	2026-03-14 20:11:12.056	2026-03-16 16:19:49.376	\N	boxes	9	3	t	\N	\N
182	186	WB Курск	2026-03-21 00:00:00	-	\N	8	1. от 0 кг до 300 кг x4 = 20000₽; 2. Большая x4 = 3400₽ | Итого: 23400₽	archived	2026-03-13 15:44:02.272	2026-03-16 16:19:53.384	\N	pallets	2	\N	t	\N	\N
241	186	WB Курск FBS	2026-03-18 00:00:00	-	\N	4	1. 0.1 x4 = 8000₽ | Итого: 8000₽	archived	2026-03-18 08:32:21.621	2026-03-18 09:06:55.133	\N	boxes	1	\N	t	1	\N
178	186	WB Курск	2026-03-21 00:00:00	-	\N	5	1. Маленькая x5 = 3250₽ | Итого: 3250₽	archived	2026-03-13 14:23:08.649	2026-03-16 16:20:04.126	\N	boxes	2	1	t	\N	\N
173	186	WB Курск	2026-03-20 00:00:00	-	\N	50	1. от 0 кг до 300 кг x50 = 250000₽ | Итого: 250000₽	archived	2026-03-13 13:51:19.473	2026-03-16 16:20:26.448	\N	pallets	2	\N	t	\N	\N
244	192	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 08:33:43.808	2026-03-25 10:35:37.139	\N	boxes	1	\N	t	1	\N
242	186	WB Курск	2026-03-25 00:00:00	-	\N	5	1. Маленькая x5 = 3250₽ | Итого: 3250₽	archived	2026-03-18 08:33:32.702	2026-03-18 09:06:57.898	\N	boxes	2	1	t	2	2026-03-26 00:00:00
233	186	WB Казань	2026-03-27 00:00:00	-	\N	5	1. Средняя x5 = 4700₽ | Итого: 4700₽	archived	2026-03-17 16:42:12.059	2026-03-18 08:28:50.921	\N	boxes	5	2	t	2	2026-03-27 00:00:00
212	265	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-16 12:37:44.942	2026-03-17 09:24:20.127	\N	boxes	1	\N	t	1	\N
219	192	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	archived	2026-03-16 18:48:14.627	2026-03-17 09:30:13.058	\N	boxes	1	\N	t	1	\N
199	192	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	archived	2026-03-16 08:32:25.783	2026-03-17 09:31:02.927	\N	boxes	1	\N	t	1	2026-03-17 00:00:00
227	192	WB Волгоград	2026-03-20 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	archived	2026-03-17 10:50:16.695	2026-03-17 11:04:24.585	\N	boxes	9	3	t	2	2026-03-20 00:00:00
234	186	WB Курск FBS	2026-03-19 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	archived	2026-03-17 16:43:46.917	2026-03-18 09:07:05.518	\N	boxes	1	\N	t	1	\N
224	223	WB Волгоград	2026-03-27 00:00:00	-	\N	10	1. Большая x10 = 9900₽ | Итого: 9900₽	archived	2026-03-17 08:27:42.052	2026-03-18 11:40:22.796	\N	boxes	9	3	t	2	2026-03-17 00:00:00
260	342	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.13 = 260₽ | Итого: 260₽	done	2026-03-18 12:57:46.867	2026-03-19 14:19:40.375	\N	boxes	1	\N	t	1	\N
245	186	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	archived	2026-03-18 08:44:15.973	2026-03-18 09:07:17.318	\N	boxes	1	\N	t	1	\N
202	255	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.6 = 1200₽ | Итого: 1200₽	done	2026-03-16 09:39:23.41	2026-03-19 13:23:18.821	\N	boxes	1	\N	t	1	\N
257	192	WB Тест	2026-03-31 00:00:00	-	\N	1	1. Маленькая x1 = 0₽ | Итого: 0₽	archived	2026-03-18 11:29:37.512	2026-03-18 12:50:26.257	\N	boxes	24	1	t	2	2026-03-24 00:00:00
251	202	WB Рязань	2026-03-21 00:00:00	-	\N	3	1. Большая x3 = 2850₽ | Итого: 2850₽	shipped	2026-03-18 09:55:33.947	2026-03-20 13:34:46.027	\N	boxes	14	3	t	2	2026-03-22 00:00:00
274	260	WB Рязань	2026-03-21 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-03-18 18:23:54.75	2026-03-20 13:35:17.068	\N	boxes	14	83	t	2	2026-03-21 00:00:00
271	186	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-18 16:45:00.511	2026-03-18 18:14:29.407	\N	boxes	1	\N	t	1	\N
263	257	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.65 = 1300₽ | Итого: 1300₽	done	2026-03-18 13:51:52.08	2026-03-18 13:53:33.08	\N	boxes	1	\N	t	1	\N
266	223	WB Тест	2026-03-26 00:00:00	-	\N	1	\N	archived	2026-03-18 16:17:00.066	2026-03-18 16:17:15.727	\N	boxes	24	\N	t	2	\N
252	223	WB Курск FBS	2026-03-22 00:00:00	-	\N	1	1. 0.1 x0.3 = 600₽ | Итого: 600₽	archived	2026-03-18 10:12:07.743	2026-03-24 14:16:41.155	\N	boxes	1	\N	t	1	2026-03-29 00:00:00
278	223	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-18 18:51:20.852	2026-03-18 19:25:41.696	\N	boxes	1	\N	t	1	\N
281	223	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	archived	2026-03-18 19:34:57.237	2026-03-18 19:36:15.255	\N	boxes	1	\N	t	1	\N
236	281	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 07:18:39.766	2026-03-19 12:57:13.273	\N	boxes	1	\N	t	1	2026-03-18 00:00:00
291	285	WB Тула (Алексин)	2026-03-21 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-03-19 09:08:17.179	2026-03-20 13:35:34.046	\N	boxes	1	3	t	2	2026-03-20 00:00:00
287	281	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 07:39:15.649	2026-03-20 15:03:56.663	\N	boxes	1	\N	t	1	\N
249	186	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	archived	2026-03-18 09:08:16.319	2026-03-18 11:39:56.66	\N	boxes	1	\N	t	1	\N
231	263	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.09 = 180₽ | Итого: 180₽	done	2026-03-17 12:44:37.697	2026-03-17 15:49:26.736	\N	boxes	1	\N	t	1	\N
207	202	WB Котовск	2026-03-18 00:00:00	-	\N	6	1. Большая x6 = 5400₽ | Итого: 5400₽	done	2026-03-16 11:13:01.91	2026-03-20 17:31:18.285	\N	boxes	15	3	t	2	2026-03-19 00:00:00
218	186	WB Краснодар	2026-03-26 00:00:00	-	\N	2	1. Средняя x2 = 1780₽ | Итого: 1780₽	archived	2026-03-16 16:57:35.971	2026-03-16 17:20:29.275	\N	boxes	8	2	t	2	2026-03-31 00:00:00
200	250	WB Электросталь	2026-03-18 00:00:00	-	\N	4	1. Средняя x4 = 3560₽ | Итого: 3560₽	shipped	2026-03-16 09:09:59.311	2026-03-17 16:21:17.01	\N	boxes	17	2	t	2	\N
267	223	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	\N	archived	2026-03-18 16:24:31.399	2026-03-18 16:26:30.549	\N	boxes	1	\N	t	1	\N
285	303	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 06:30:57.157	2026-03-23 11:27:57.346	\N	boxes	1	\N	f	1	\N
167	192	WB Курск	2026-03-13 00:00:00	-	\N	1	1. Большая x1 = 850₽ | Итого: 850₽	archived	2026-03-12 14:31:08.949	2026-03-16 18:57:41.23	\N	boxes	2	3	t	\N	\N
204	262	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-16 09:48:14.091	2026-03-19 13:30:16.942	\N	boxes	1	\N	t	1	\N
183	192	WB Волгоград	2026-03-20 00:00:00	-	\N	1	1. 301–400 x1 = 0₽ | Итого: 0₽	archived	2026-03-13 18:21:09.511	2026-03-16 19:02:48.464	\N	pallets	9	\N	t	\N	\N
268	223	WB Курск FBS	2026-03-16 00:00:00	-	\N	1	\N	archived	2026-03-18 16:25:23.107	2026-03-18 16:26:33.453	\N	boxes	1	\N	t	1	\N
220	262	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-17 07:23:18.43	2026-03-19 13:30:23.663	\N	boxes	1	\N	t	1	\N
238	192	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	archived	2026-03-18 08:22:28.217	2026-03-18 08:22:58.153	\N	boxes	1	\N	t	1	\N
194	223	WB Курск FBS	2026-03-19 00:00:00	-	\N	150	1. 0.1 x150 = 300000₽ | Итого: 300000₽	archived	2026-03-15 19:23:59.156	2026-03-16 16:18:58.938	\N	boxes	1	\N	t	1	2026-03-22 00:00:00
197	186	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.11 = 220₽ | Итого: 220₽	archived	2026-03-15 21:04:30.178	2026-03-16 16:19:28.084	\N	boxes	1	\N	t	1	2026-03-19 00:00:00
179	186	WB Курск	2026-03-20 00:00:00	-	\N	11	1. 301–400 x5 = 30000₽; 2. 301–400 x6 = 36000₽ | Итого: 66000₽	archived	2026-03-13 15:06:19.446	2026-03-16 16:19:58.006	\N	pallets	2	\N	t	\N	\N
174	186	WB Курск	2026-03-23 00:00:00	-	\N	6	1. Маленькая x6 = 3900₽ | Итого: 3900₽	archived	2026-03-13 14:07:41.561	2026-03-16 16:20:18.104	\N	boxes	2	1	t	\N	\N
258	223	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	archived	2026-03-18 11:58:55.288	2026-03-18 12:03:40.79	\N	boxes	1	\N	t	1	\N
217	186	WB Курск	2026-03-23 00:00:00	-	\N	3	1. Средняя x4 = 3000₽ | Итого: 3000₽	archived	2026-03-16 16:54:56.397	2026-03-16 19:14:50.157	\N	boxes	2	1	t	2	2026-03-18 00:00:00
302	292	WB Курск FBS	2026-03-19 00:00:00	-	\N	1	\N	done	2026-03-19 12:56:24.363	2026-03-21 11:02:57.353	\N	boxes	1	\N	t	1	\N
298	202	WB Невинномысск	2026-03-26 00:00:00	-	\N	9	1. Большая x9 = 8910₽ | Итого: 8910₽	shipped	2026-03-19 12:20:35.702	2026-03-25 08:47:39.181	\N	boxes	10	3	t	2	2026-03-27 00:00:00
213	263	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-16 12:47:59.192	2026-03-17 09:24:48.856	\N	boxes	1	\N	t	1	\N
225	192	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	archived	2026-03-17 08:42:06.044	2026-03-17 09:29:59.567	\N	boxes	1	\N	t	1	\N
191	192	WB Курск	2026-03-18 00:00:00	-	\N	1	1. Средняя x1 = 750₽ | Итого: 750₽	archived	2026-03-15 16:52:06.382	2026-03-17 09:31:30.626	\N	boxes	2	2	t	1	\N
186	209	WB Волгоград	2026-03-20 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 0₽ | Итого: 0₽	done	2026-03-14 07:28:28.249	2026-03-21 11:04:04.895	\N	pallets	9	\N	t	\N	\N
256	186	WB Тест	2026-03-31 00:00:00	-	\N	1	1. Большая x1 = 10₽ | Итого: 10₽	archived	2026-03-18 11:15:14.009	2026-03-18 12:51:18.354	\N	boxes	24	3	t	2	2026-03-31 00:00:00
269	186	WB Курск FBS	2026-03-16 00:00:00	-	\N	1	\N	archived	2026-03-18 16:26:25.011	2026-03-18 16:26:37.013	\N	boxes	1	\N	t	1	\N
243	186	WB Курск FBS	2026-03-19 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6000₽	archived	2026-03-18 08:33:43.449	2026-03-18 09:07:13.277	\N	boxes	1	\N	t	1	\N
246	186	WB Курск FBS	2026-03-19 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4000₽	archived	2026-03-18 08:44:32.253	2026-03-18 09:07:20.402	\N	boxes	1	\N	t	1	\N
203	260	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-16 09:45:18.411	2026-03-18 13:31:54.299	\N	boxes	1	\N	t	1	\N
282	223	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	\N	archived	2026-03-18 19:38:20.209	2026-03-18 19:40:12.885	\N	boxes	1	\N	t	1	\N
264	266	WB Курск	2026-03-17 00:00:00	-	\N	1	Отгрузка фбс Курск за 17.03	done	2026-03-18 15:10:17.501	2026-03-18 15:11:14.34	\N	boxes	2	1	t	\N	2026-03-17 00:00:00
275	223	WB Курск FBS	2026-03-19 00:00:00	-	\N	1	\N	archived	2026-03-18 18:28:34.791	2026-03-18 19:25:29.963	\N	boxes	1	\N	t	1	\N
279	223	WB Курск FBS	2026-03-23 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4000₽	archived	2026-03-18 19:24:17.899	2026-03-18 19:25:46.423	\N	boxes	1	\N	t	1	\N
289	186	WB Казань	2026-03-20 00:00:00	-	5	3	тест	archived	2026-03-19 08:44:58.84	2026-03-19 08:57:43.964	\N	pallets	5	\N	t	2	\N
292	223	WB Котовск	2026-03-25 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	archived	2026-03-19 09:42:02.482	2026-03-19 10:08:45.329	\N	boxes	15	3	t	2	2026-03-19 00:00:00
235	255	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.8 = 1600₽ | Итого: 1600₽	done	2026-03-18 05:14:50.906	2026-03-19 13:22:41.576	\N	boxes	1	\N	t	1	\N
288	209	WB Тула (Алексин)	2026-03-22 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 5300₽ | Итого: 5300₽	archived	2026-03-19 08:40:46.544	2026-03-19 12:20:31.572	\N	pallets	1	\N	t	2	2026-03-21 00:00:00
309	281	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 07:28:51.467	2026-03-24 04:18:35.354	\N	boxes	1	\N	t	1	\N
223	281	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-17 07:25:49.042	2026-03-19 12:57:06.072	\N	boxes	1	\N	t	1	\N
228	265	WB Тула (Алексин)	2026-03-18 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	done	2026-03-17 11:42:21.051	2026-03-20 14:19:28.986	\N	boxes	1	3	t	2	2026-03-18 00:00:00
261	266	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.52 = 1040₽ | Итого: 1040₽	done	2026-03-18 13:27:55.707	2026-03-25 10:35:37.145	\N	boxes	1	\N	t	1	\N
296	263	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Итого: 1000₽	done	2026-03-19 10:53:27.168	2026-03-24 04:07:20.04	\N	boxes	1	\N	t	1	\N
294	362	WB Электросталь	2026-03-22 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 8900₽ | Итого: 8900₽	shipped	2026-03-19 09:47:48.487	2026-03-25 07:11:36.102	\N	pallets	17	\N	t	2	2026-03-22 00:00:00
165	188	WB Курск	2026-03-14 00:00:00	-	\N	3	1. Средняя x3 = 2250₽ | Итого: 2250₽	archived	2026-03-12 12:15:39.752	2026-03-16 18:57:25.993	\N	boxes	2	2	t	\N	\N
168	192	WB Казань	2026-03-27 00:00:00	-	\N	1	1. 301–400 x1 = 0₽ | Итого: 0₽	archived	2026-03-12 15:10:01.362	2026-03-16 18:57:45.681	\N	pallets	5	\N	t	\N	\N
262	270	WB Курск	2026-03-17 00:00:00	-	\N	1	\N	done	2026-03-18 13:37:26.073	2026-03-18 13:40:00.298	\N	boxes	2	3	t	1	2026-03-17 00:00:00
180	209	WB Волгоград	2026-03-27 00:00:00	-	\N	2	1. Средняя x1 = 0₽; 2. 301–400 x1 = 0₽ | Итого: 0₽	archived	2026-03-13 15:24:32.301	2026-03-16 19:02:54.68	\N	boxes	9	2	t	\N	\N
205	266	WB Екатеринбург	2026-03-23 00:00:00	-	\N	7	1. Средняя x7 = 7700₽ | Итого: 7700₽	shipped	2026-03-16 10:23:03.439	2026-03-18 08:42:33.869	\N	boxes	13	2	t	2	2026-03-23 00:00:00
232	192	WB Воронеж	2026-03-19 00:00:00	-	\N	1	1. Большая x1 = 850₽ | Итого: 850₽	archived	2026-03-17 14:11:47.122	2026-03-18 14:03:40.037	\N	boxes	7	3	t	2	2026-03-18 00:00:00
181	209	WB Курск	2026-03-31 00:00:00	-	\N	5	1. Средняя x5 = 3750₽ | Итого: 3750₽	archived	2026-03-13 15:25:27.711	2026-03-16 19:03:00.232	\N	boxes	2	2	t	\N	\N
265	347	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	done	2026-03-18 15:16:10.391	2026-03-25 09:45:35.812	\N	boxes	1	\N	t	1	\N
222	292	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	1. 0.1 x1.35 = 2700₽ | Итого: 2700₽	done	2026-03-17 07:25:02.34	2026-03-21 11:03:12.232	\N	boxes	1	\N	t	1	\N
184	192	WB Коледино	2026-03-29 00:00:00	-	\N	2	1. Средняя x1 = 0₽; 2. Большая x1 = 0₽ | Итого: 0₽	archived	2026-03-13 19:08:13.287	2026-03-16 19:04:50.322	\N	boxes	12	2	t	\N	\N
239	186	WB Курск	2026-03-25 00:00:00	-	\N	5	1. Средняя x5 = 3750₽ | Итого: 3750₽	archived	2026-03-18 08:24:31.811	2026-03-18 09:06:48.149	\N	boxes	2	2	t	2	2026-03-25 00:00:00
214	192	WB Курск FBS	2026-03-16 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	archived	2026-03-16 13:17:28.086	2026-03-17 09:30:53.945	\N	boxes	1	\N	t	1	\N
221	292	WB Курск FBS	2026-03-17 00:00:00	-	\N	1	1. 0.1 x1.35 = 2700₽ | Итого: 2700₽	done	2026-03-17 07:24:40.933	2026-03-18 14:15:42.383	\N	boxes	1	\N	t	1	\N
187	209	WB Казань	2026-03-27 00:00:00	-	\N	1	1. 301–400 x1 = 0₽ | Итого: 0₽	done	2026-03-14 11:03:41.455	2026-03-21 11:03:53.321	\N	pallets	5	\N	t	\N	\N
240	186	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2000₽	archived	2026-03-18 08:25:00.471	2026-03-18 09:06:51.555	\N	boxes	1	\N	t	1	\N
195	223	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.32 = 640₽ | Итого: 640₽	archived	2026-03-15 20:12:21.384	2026-03-16 16:19:03.012	\N	boxes	1	\N	t	1	2026-03-18 00:00:00
192	223	WB Курск FBS	2026-03-16 00:00:00	-	\N	100	1. 0.1 x100 = 20000₽ | Итого: 20000₽	archived	2026-03-15 18:53:32.117	2026-03-16 16:19:16.984	\N	boxes	1	\N	t	1	\N
176	186	WB Курск	2026-03-18 00:00:00	-	\N	564	1. от 0 кг до 300 кг x4 = 20000₽; 2. Коробка x556 = 0₽; 3. Маленькая x4 = 2600₽ | Итого: 22600₽	archived	2026-03-13 14:12:08.731	2026-03-16 16:20:08.13	\N	pallets	2	\N	t	\N	\N
175	186	WB Курск	2026-03-21 00:00:00	-	\N	7	1. 301–400 x7 = 42000₽ | Итого: 42000₽	archived	2026-03-13 14:11:18.477	2026-03-16 16:20:12.35	\N	pallets	2	\N	t	\N	\N
247	186	WB Курск FBS	2026-03-18 00:00:00	-	\N	6	1. 0.1 x6 = 12000₽ | Итого: 12000₽	archived	2026-03-18 08:50:25.831	2026-03-18 09:07:23.123	\N	boxes	1	\N	t	1	\N
303	265	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 13:39:38.046	2026-03-20 14:19:45.603	\N	boxes	1	\N	t	1	\N
301	270	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 12:44:46.518	2026-03-20 14:18:40.399	\N	boxes	1	\N	t	1	\N
198	237	WB Краснодар	2026-03-19 00:00:00	-	\N	1	1. Маленькая x1 = 0₽ | Итого: 0₽	shipped	2026-03-15 21:53:18.938	2026-03-17 16:21:01.425	\N	boxes	8	1	t	2	\N
254	192	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 10:38:48.968	2026-03-18 10:47:06.725	\N	boxes	1	\N	t	1	\N
250	186	WB Курск	2026-03-25 00:00:00	-	\N	1	1. Маленькая x1 = 650₽ | Итого: 650₽	archived	2026-03-18 09:10:37.688	2026-03-18 11:39:48.579	\N	boxes	2	1	t	2	2026-03-25 00:00:00
286	262	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 07:29:23.744	2026-03-25 10:35:37.147	\N	boxes	1	\N	t	1	\N
259	260	WB Курск FBS	2026-03-18 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-18 12:14:08.597	2026-03-18 13:31:29.6	\N	boxes	1	\N	t	1	\N
201	240	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-16 09:19:32.933	2026-03-18 13:33:12.583	\N	boxes	1	\N	t	1	2026-03-16 00:00:00
270	186	WB Курск FBS	2026-03-17 00:00:00	-	\N	1	\N	archived	2026-03-18 16:34:00.076	2026-03-18 16:45:07.564	\N	boxes	1	\N	t	1	\N
273	223	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	\N	archived	2026-03-18 18:13:22.711	2026-03-18 18:14:12.556	\N	boxes	1	\N	t	1	\N
277	223	WB Курск FBS	2026-03-17 00:00:00	-	\N	1	\N	archived	2026-03-18 18:41:10.667	2026-03-18 19:25:25.166	\N	boxes	1	\N	t	1	\N
276	223	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	\N	archived	2026-03-18 18:38:30.68	2026-03-18 19:25:34.688	\N	boxes	1	\N	t	1	\N
280	223	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-18 19:31:27.394	2026-03-18 19:36:18.267	\N	boxes	1	\N	t	1	\N
293	363	WB Тула (Алексин)	2026-03-22 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Итого: 10600₽	shipped	2026-03-19 09:44:37.779	2026-03-20 13:41:32.091	\N	pallets	1	\N	t	2	2026-03-22 00:00:00
226	273	WB Волгоград	2026-03-20 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Итого: 5250₽	shipped	2026-03-17 08:48:38.626	2026-03-20 13:17:55.697	\N	boxes	9	83	t	2	2026-03-20 00:00:00
290	186	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-19 08:58:07.439	2026-03-19 10:08:51.23	\N	boxes	1	\N	t	1	\N
283	255	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.6 = 1200₽ | Итого: 1200₽	done	2026-03-19 04:14:27.986	2026-03-20 09:27:59.991	\N	boxes	1	\N	t	1	\N
297	192	WB Екатеринбург (Перспективная 14)	2026-03-23 00:00:00	-	\N	1	1. Большая x1 = 1200₽ | Итого: 1200₽	archived	2026-03-19 12:06:48.373	2026-03-19 12:20:27.232	\N	boxes	13	3	t	2	2026-03-23 00:00:00
304	223	WB Курск FBS	2026-03-21 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Услуги клиента: Помощь на выгрузке, Забор груза с адреса | Итого: 6 510₽	archived	2026-03-19 14:05:23.338	2026-03-19 14:11:41.231	\N	boxes	1	\N	t	1	\N
208	273	WB Котовск	2026-03-18 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4500₽ | Итого: 4500₽	done	2026-03-16 11:44:01.65	2026-03-20 17:31:30.015	\N	boxes	15	83	t	2	2026-03-18 00:00:00
229	265	WB Курск FBS	2026-03-17 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-17 11:44:21.417	2026-03-20 14:19:36.671	\N	boxes	1	\N	t	1	\N
305	186	WB Курск FBS	2026-03-21 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 6 510₽	archived	2026-03-19 14:13:03.237	2026-03-19 18:14:32.326	\N	boxes	1	\N	t	1	\N
306	186	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 1 110₽	archived	2026-03-19 14:31:01.874	2026-03-19 18:14:39.119	\N	boxes	1	\N	t	1	\N
308	255	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.7 = 1400₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 1 970₽	done	2026-03-20 07:19:29.338	2026-03-21 10:20:42.623	\N	boxes	1	\N	t	1	\N
307	192	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.17 = 340₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 850₽	done	2026-03-19 15:38:23.35	2026-03-25 10:35:37.155	\N	boxes	1	\N	t	1	\N
340	283	WB Волгоград	2026-03-27 00:00:00	-	\N	2	1. Средняя x2 = 1780₽ | Итого: 1780₽	shipped	2026-03-22 12:11:27.801	2026-03-26 10:22:18.929	\N	boxes	9	2	t	2	2026-03-27 00:00:00
344	241	WB Краснодар	2026-03-26 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-23 05:02:02.094	2026-03-25 09:21:24.838	\N	boxes	8	3	t	2	2026-03-26 00:00:00
342	186	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Услуги клиента: Помощь на выгрузке | Итого: 840₽	archived	2026-03-22 14:40:38.928	2026-03-24 14:16:16.603	\N	boxes	1	\N	t	1	\N
311	202	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.8 = 1600₽ | Итого: 1 600₽	done	2026-03-20 08:06:21.027	2026-03-20 09:25:17.181	\N	boxes	1	\N	t	1	\N
334	316	WB Волгоград	2026-03-27 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-21 14:02:09.464	2026-03-25 08:50:47.122	\N	boxes	9	3	t	2	2026-03-27 00:00:00
317	291	WB Электросталь	2026-03-22 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-20 09:53:04.312	2026-03-25 08:48:34.918	\N	boxes	17	2	t	2	2026-03-22 00:00:00
321	270	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 12:54:35.836	2026-03-24 04:08:02.099	\N	boxes	1	\N	t	1	\N
315	389	WB Электросталь	2026-03-22 00:00:00	-	\N	4	1. Большая x4 = 3960₽ | Итого: 3960₽	shipped	2026-03-20 08:46:57.864	2026-03-20 13:59:52.735	\N	boxes	17	3	t	2	2026-03-22 00:00:00
310	346	WB Коледино	2026-03-22 00:00:00	-	\N	11	1. от 5 до 10 коробок x11 = 52250₽ | Итого: 52250₽	shipped	2026-03-20 08:02:12.068	2026-03-20 14:06:52.49	\N	boxes	12	83	t	2	2026-03-23 00:00:00
318	346	WB Тула (Алексин)	2026-03-22 00:00:00	-	\N	4	1. Большая x4 = 3600₽ | Итого: 3600₽	shipped	2026-03-20 10:20:57.589	2026-03-20 14:09:02.629	\N	boxes	1	3	t	2	2026-03-22 00:00:00
323	265	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 13:55:23.542	2026-03-24 03:36:57.066	\N	boxes	1	\N	t	1	\N
316	262	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 09:30:00.748	2026-03-23 18:24:08.578	\N	boxes	1	\N	t	1	\N
314	257	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.15 = 300₽ | Итого: 300₽	done	2026-03-20 08:43:36.674	2026-03-24 04:12:43.36	\N	boxes	1	\N	t	1	\N
320	342	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.04 = 80₽ | Итого: 80₽	done	2026-03-20 12:30:55.688	2026-03-24 03:38:57.94	\N	boxes	1	\N	t	1	\N
329	303	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	\N	done	2026-03-21 10:26:21.746	2026-03-21 10:26:47.517	\N	boxes	1	\N	t	1	\N
330	292	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	\N	archived	2026-03-21 11:01:15.743	2026-03-21 11:01:59.09	\N	boxes	1	\N	t	1	\N
331	292	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	\N	done	2026-03-21 11:02:27.744	2026-03-21 11:02:34.829	\N	boxes	1	\N	t	1	\N
332	266	WB Курск FBS	2026-03-20 00:00:00	-	\N	1	\N	done	2026-03-21 11:27:46.151	2026-03-21 11:27:52.059	\N	boxes	1	\N	t	1	\N
300	304	WB Тула (Алексин)	2026-03-22 00:00:00	-	\N	1	1. Палета x1 = 0₽ | Итого: 0₽	archived	2026-03-19 12:41:09.559	2026-03-24 11:17:27.141	\N	pallets	1	\N	t	2	2026-03-22 00:00:00
339	186	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 1 340₽	archived	2026-03-22 10:24:36.075	2026-03-24 14:16:21.564	\N	boxes	1	\N	t	1	\N
333	263	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.325 = 650₽ | Итого: 650₽	done	2026-03-21 11:56:40.307	2026-03-23 11:27:57.355	\N	boxes	1	\N	t	1	\N
347	291	WB Электросталь	2026-03-22 00:00:00	-	0	1	\N	shipped	2026-03-23 06:14:36.324	2026-03-23 06:15:03.387	\N	boxes	17	\N	t	2	\N
349	423	WB Тула (Алексин)	2026-03-25 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-23 06:23:54.832	2026-03-23 06:31:00.366	\N	boxes	1	2	t	2	2026-03-25 00:00:00
348	423	WB Коледино	2026-03-25 00:00:00	-	\N	1	1. Средняя x1 = 850₽ | Итого: 850₽	shipped	2026-03-23 06:22:46.379	2026-03-23 06:31:26.485	\N	boxes	12	2	t	2	2026-03-25 00:00:00
338	223	WB Курск FBS	2026-03-30 00:00:00	-	\N	4	1. 0.1 x1.9 = 3800₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 4 490₽	archived	2026-03-22 09:33:50.381	2026-03-24 14:16:35.483	\N	boxes	1	\N	t	1	2026-03-26 00:00:00
335	316	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-03-21 14:03:12.262	2026-03-25 08:50:40.066	\N	boxes	16	3	t	2	2026-03-26 00:00:00
336	411	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	2	1. Средняя x1 = 1100₽; 2. Большая x1 = 1200₽ | Итого: 2300₽	shipped	2026-03-21 20:41:10.14	2026-03-25 08:51:35.957	\N	boxes	13	2	t	2	2026-03-30 00:00:00
343	384	WB Котовск	2026-03-25 00:00:00	-	\N	6	1. Большая x6 = 5400₽ | Итого: 5400₽	shipped	2026-03-22 19:08:46.996	2026-03-25 09:20:49.625	\N	boxes	15	3	t	2	2026-03-25 00:00:00
328	375	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Итого: 800₽	done	2026-03-21 09:31:20.02	2026-03-23 11:27:57.358	\N	boxes	1	\N	t	1	\N
341	418	WB Казань	2026-03-27 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	archived	2026-03-22 12:51:21.282	2026-03-25 09:20:11.682	\N	boxes	5	1	t	2	2026-03-23 00:00:00
322	202	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-20 13:06:48.172	2026-03-25 10:35:37.157	\N	boxes	1	\N	t	1	\N
345	241	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-03-23 05:02:55.301	2026-03-25 09:21:53.203	\N	boxes	16	3	t	2	2026-03-26 00:00:00
346	241	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	1	1. Большая x1 = 1200₽ | Итого: 1200₽	shipped	2026-03-23 05:03:19.107	2026-03-25 09:22:20.132	\N	boxes	13	3	t	2	2026-03-30 00:00:00
350	426	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-03-23 07:36:19.401	2026-03-25 09:22:55.082	\N	boxes	16	2	t	2	2026-03-26 00:00:00
337	240	WB Воронеж	2026-03-25 00:00:00	-	\N	2	1. Большая x2 = 1700₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 1720₽	archived	2026-03-22 09:19:29.456	2026-03-25 09:37:24.872	\N	boxes	7	3	t	2	2026-03-25 00:00:00
324	297	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 14:06:56.394	2026-03-25 10:35:37.159	\N	boxes	1	\N	t	1	\N
319	260	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 10:54:39.345	2026-03-25 10:35:37.16	\N	boxes	1	\N	t	1	\N
313	258	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-20 08:20:28.332	2026-03-25 10:35:37.162	\N	boxes	1	\N	t	1	\N
354	427	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	1	1. Маленькая x1 = 1000₽ | Итого: 1000₽	shipped	2026-03-23 07:45:02.692	2026-03-25 09:25:09.837	\N	boxes	13	1	t	2	2026-03-30 00:00:00
360	292	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	\N	done	2026-03-23 10:49:29.266	2026-03-23 10:49:34.683	\N	boxes	1	\N	t	1	\N
362	266	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	\N	done	2026-03-23 10:52:58.151	2026-03-23 10:53:06.252	\N	boxes	1	\N	t	1	\N
325	255	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.8 = 1600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 2 180₽	done	2026-03-21 05:25:51.656	2026-03-23 10:54:25.846	\N	boxes	1	\N	t	1	\N
363	303	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	\N	done	2026-03-23 10:57:08.828	2026-03-23 10:57:15.282	\N	boxes	1	\N	t	1	\N
355	430	WB Новосемейкино	2026-03-26 00:00:00	-	\N	2	1. от 301 кг до 400 кг x2 = 18600₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 18620₽	shipped	2026-03-23 07:52:40.868	2026-03-25 09:27:28.051	\N	pallets	16	\N	t	2	2026-03-26 00:00:00
327	262	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-21 09:09:39.001	2026-03-23 11:27:57.36	\N	boxes	1	\N	t	1	\N
326	281	WB Курск FBS	2026-03-21 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-21 06:22:36.658	2026-03-23 11:27:57.364	\N	boxes	1	\N	t	1	\N
379	454	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	3	1. Большая x3 = 3600₽ | Услуги клиента: Помощь на выгрузке x3 | Итого: 3630₽	shipped	2026-03-23 14:29:02.016	2026-03-25 10:20:08.37	\N	boxes	13	3	t	2	2026-03-30 00:00:00
375	223	WB Воронеж	2026-03-29 00:00:00	-	\N	1	1. Маленькая x1 = 650₽ | Итого: 650₽	archived	2026-03-23 13:42:26.911	2026-03-23 13:48:43.139	\N	boxes	7	1	t	2	2026-03-23 00:00:00
383	292	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-23 17:45:09.017	2026-03-23 17:45:21.84	\N	boxes	1	\N	t	1	\N
369	303	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-23 13:10:00.005	2026-03-24 04:13:42.628	\N	boxes	1	\N	t	1	\N
384	255	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-23 17:46:14.282	2026-03-23 17:46:30.172	\N	boxes	1	\N	t	1	\N
385	375	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-23 17:48:11.199	2026-03-23 17:48:20.056	\N	boxes	1	\N	t	1	\N
366	266	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.9 = 1800₽ | Итого: 1 800₽	done	2026-03-23 12:15:38.085	2026-03-23 18:07:32.205	\N	boxes	1	\N	t	1	\N
381	342	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.13 = 260₽ | Итого: 260₽	done	2026-03-23 16:22:32.909	2026-03-23 18:12:40.206	\N	boxes	1	\N	t	1	\N
386	347	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-23 18:22:11.882	2026-03-23 18:22:22.843	\N	boxes	1	\N	t	1	\N
364	262	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-23 11:30:12.376	2026-03-23 18:23:51.87	\N	boxes	1	\N	t	1	\N
361	263	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-23 10:51:07.292	2026-03-24 04:07:11.76	\N	boxes	1	\N	t	1	\N
365	265	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.21 = 420₽ | Итого: 420₽	done	2026-03-23 12:05:22.661	2026-03-24 03:37:16.667	\N	boxes	1	\N	t	1	\N
351	297	WB Волгоград	2026-03-27 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-23 07:38:44.023	2026-03-25 09:23:36.712	\N	boxes	9	2	t	2	2026-03-27 00:00:00
367	257	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.15 = 300₽ | Итого: 300₽	done	2026-03-23 12:32:48.655	2026-03-24 04:12:16.771	\N	boxes	1	\N	t	1	\N
357	435	WB Котовск	2026-03-25 00:00:00	-	\N	2	1. Большая x2 = 1800₽ | Итого: 1800₽	shipped	2026-03-23 09:26:29.766	2026-03-25 09:28:40.463	\N	boxes	15	3	t	2	2026-03-26 00:00:00
358	435	WB Котовск	2026-03-25 00:00:00	-	\N	3	1. Средняя x3 = 2400₽ | Итого: 2400₽	shipped	2026-03-23 09:26:46.626	2026-03-25 09:28:53.861	\N	boxes	15	2	t	2	2026-03-25 00:00:00
370	436	WB Тула (Алексин)	2026-03-25 00:00:00	-	\N	2	1. Маленькая x2 = 1400₽ | Итого: 1400₽	shipped	2026-03-23 13:21:15.429	2026-03-25 10:11:00.925	\N	boxes	1	1	t	2	2026-03-25 00:00:00
371	436	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-03-23 13:22:01.65	2026-03-25 10:11:41.135	\N	boxes	16	3	t	2	2026-03-26 00:00:00
372	436	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	2	1. Маленькая x1 = 1000₽; 2. Коробка x1 = 0₽ | Итого: 1000₽	shipped	2026-03-23 13:22:35.806	2026-03-25 10:12:27.706	\N	boxes	13	1	t	2	2026-03-30 00:00:00
373	436	WB Невинномысск	2026-03-26 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 0₽ | Итого: 0₽	shipped	2026-03-23 13:23:26.598	2026-03-25 10:14:42.104	\N	pallets	10	\N	t	2	2026-03-26 00:00:00
374	436	WB Новосемейкино	2026-03-26 00:00:00	-	\N	3	1. Маленькая x3 = 2520₽ | Итого: 2520₽	shipped	2026-03-23 13:24:09.195	2026-03-25 10:15:13.972	\N	boxes	16	1	t	2	2026-03-26 00:00:00
376	454	WB Тула (Алексин)	2026-03-25 00:00:00	-	\N	7	1. Большая x7 = 6300₽ | Услуги клиента: Помощь на выгрузке x7 | Итого: 6370₽	shipped	2026-03-23 14:25:43.074	2026-03-25 10:18:52.675	\N	boxes	1	3	t	2	2026-03-25 00:00:00
377	454	WB Невинномысск	2026-03-26 00:00:00	-	\N	4	1. Большая x4 = 3960₽ | Услуги клиента: Помощь на выгрузке x4 | Итого: 4000₽	shipped	2026-03-23 14:26:50.326	2026-03-25 10:19:24.25	\N	boxes	10	3	t	2	2026-03-26 00:00:00
378	454	WB Новосемейкино	2026-03-26 00:00:00	-	\N	3	1. Большая x3 = 3120₽ | Услуги клиента: Помощь на выгрузке x3 | Итого: 3150₽	shipped	2026-03-23 14:27:50.787	2026-03-25 10:19:42.305	\N	boxes	16	3	t	2	2026-03-26 00:00:00
380	460	WB Новосемейкино	2026-03-26 00:00:00	-	\N	3	1. Большая x3 = 3120₽ | Итого: 3120₽	shipped	2026-03-23 15:53:40.726	2026-03-25 10:21:05.808	\N	boxes	16	3	t	2	2026-03-23 00:00:00
382	463	WB Волгоград	2026-03-27 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-23 17:19:14.347	2026-03-25 10:21:36.139	\N	boxes	9	3	t	2	2026-03-28 00:00:00
387	291	WB Тула (Алексин)	2026-03-25 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-23 18:30:13.848	2026-03-25 10:22:33.11	\N	boxes	1	2	t	2	2026-03-25 00:00:00
389	346	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5500₽ | Итого: 5500₽	shipped	2026-03-23 19:41:30.516	2026-03-25 10:24:28.143	\N	boxes	16	83	t	2	2026-03-26 00:00:00
356	283	WB Невинномысск	2026-03-26 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-23 08:12:06.048	2026-03-26 10:22:37.678	\N	boxes	10	2	t	2	2026-03-26 00:00:00
368	303	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-23 13:08:54.358	2026-03-25 10:35:37.167	\N	boxes	1	\N	t	1	\N
391	223	WB Курск	2026-03-25 00:00:00	-	\N	1	1. Маленькая x2 = 1300₽ | Итого: 1300₽	archived	2026-03-23 19:59:14.722	2026-03-23 20:01:38.564	\N	boxes	2	1	t	2	2026-03-23 00:00:00
392	223	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Услуги клиента: Забор груза с адреса | Итого: 1 300₽	archived	2026-03-23 20:08:44.161	2026-03-23 20:09:36.062	\N	boxes	1	\N	t	1	\N
394	263	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-24 04:05:34.271	2026-03-24 04:06:14.981	\N	boxes	1	\N	t	1	\N
393	263	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-24 04:04:50.027	2026-03-24 04:06:33.353	\N	boxes	1	\N	t	1	\N
395	270	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-24 04:07:54.798	2026-03-24 04:08:16.414	\N	boxes	1	\N	t	1	\N
396	257	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	archived	2026-03-24 04:12:04.402	2026-03-24 04:12:53.963	\N	boxes	1	\N	t	1	\N
397	281	WB Курск FBS	2026-03-23 00:00:00	-	\N	1	\N	done	2026-03-24 04:17:59.202	2026-03-24 04:18:15.486	\N	boxes	1	\N	t	1	\N
426	262	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 10:26:57.839	2026-03-26 13:43:10.14	\N	boxes	1	\N	t	1	\N
398	192	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.15 = 300₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 815₽	archived	2026-03-24 05:01:03.903	2026-03-24 09:04:49.534	\N	boxes	1	\N	t	1	\N
406	260	WB Курск FBS	2026-03-19 00:00:00	-	\N	1	\N	done	2026-03-24 11:53:09.628	2026-03-24 11:53:35.631	\N	boxes	1	\N	t	1	\N
388	186	WB Казань	2026-03-27 00:00:00	-	\N	3	1. Маленькая x3 = 2520₽ | Итого: 2520₽	archived	2026-03-23 19:39:02.526	2026-03-24 14:16:08.928	\N	boxes	5	1	t	2	2026-03-27 00:00:00
407	342	WB Курск FBS	2026-03-19 00:00:00	-	\N	1	Счет за доставку фбс до периода заявок в мини-ап.	done	2026-03-24 12:05:32.922	2026-03-24 12:10:08.153	\N	boxes	1	\N	t	1	\N
284	303	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-19 06:30:26.854	2026-03-25 10:35:37.143	\N	boxes	1	\N	f	1	\N
416	255	WB Курск FBS	2026-03-25 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-03-25 08:00:40.543	2026-03-26 08:40:32.028	\N	boxes	1	\N	t	1	\N
410	350	WB Рязань	2026-03-28 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-03-24 14:08:05.498	2026-03-26 10:04:06.433	\N	boxes	14	83	t	2	2026-03-28 00:00:00
402	281	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-24 07:07:06.896	2026-03-25 09:35:02.684	\N	boxes	1	\N	t	1	\N
411	342	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-24 14:27:31.973	2026-03-24 16:36:26.568	\N	boxes	1	\N	t	1	\N
415	281	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 07:57:34.34	2026-03-26 08:51:30.494	\N	boxes	1	\N	t	1	\N
352	297	WB Коледино	2026-03-25 00:00:00	-	\N	1	1. Средняя x1 = 850₽ | Итого: 850₽	shipped	2026-03-23 07:39:04.482	2026-03-25 09:23:50.871	\N	boxes	12	2	t	2	2026-03-25 00:00:00
353	297	WB Электросталь	2026-03-25 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-23 07:39:24.892	2026-03-25 09:24:23.03	\N	boxes	17	2	t	2	2026-03-25 00:00:00
401	255	WB Курск FBS	2026-03-24 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-03-24 06:59:25.7	2026-03-25 09:32:33.367	\N	boxes	1	\N	t	1	\N
417	292	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	\N	done	2026-03-25 09:39:23.874	2026-03-25 09:41:43.47	\N	boxes	1	\N	t	1	\N
404	375	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-24 09:04:53.336	2026-03-25 09:44:28.248	\N	boxes	1	\N	t	1	\N
418	347	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	\N	done	2026-03-25 09:45:27.934	2026-03-25 09:45:43.325	\N	boxes	1	\N	t	1	\N
409	270	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-24 13:06:26.361	2026-03-25 09:48:30.642	\N	boxes	1	\N	t	1	\N
390	346	WB Невинномысск	2026-03-26 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Итого: 5250₽	shipped	2026-03-23 19:42:26.672	2026-03-25 10:25:17.56	\N	boxes	10	83	t	2	2026-03-26 00:00:00
414	486	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 07:18:34.749	2026-03-25 10:12:27.311	\N	boxes	1	\N	t	1	\N
424	368	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	\N	done	2026-03-25 10:13:11.397	2026-03-25 10:13:18.892	\N	boxes	1	\N	t	1	\N
399	346	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 7500₽ | Итого: 7500₽	shipped	2026-03-24 06:21:33.397	2026-03-25 10:26:12.093	\N	boxes	13	83	t	2	2026-03-30 00:00:00
413	285	WB Электросталь	2026-03-29 00:00:00	-	\N	2	1. Большая x2 = 1980₽ | Итого: 1980₽	shipped	2026-03-25 07:13:22.168	2026-03-25 10:29:05.897	\N	boxes	17	3	t	2	2026-03-25 00:00:00
421	493	WB Казань	2026-03-27 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-03-25 10:01:24.133	2026-03-25 10:29:48.6	\N	boxes	5	1	t	2	2026-03-26 00:00:00
422	492	WB Волгоград	2026-03-27 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-25 10:03:53.039	2026-03-25 10:31:05.917	\N	boxes	9	2	t	2	2026-03-27 00:00:00
423	492	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-03-25 10:04:36.737	2026-03-25 10:31:25.721	\N	boxes	16	2	t	2	2026-03-26 00:00:00
425	273	WB Невинномысск	2026-03-26 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Итого: 5250₽	shipped	2026-03-25 10:25:13.033	2026-03-25 10:31:56.216	\N	boxes	10	83	t	2	2026-03-26 00:00:00
427	273	WB Новосемейкино	2026-03-26 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5500₽ | Итого: 5500₽	shipped	2026-03-25 10:27:12.775	2026-03-25 10:32:08.723	\N	boxes	16	83	t	2	2026-03-26 00:00:00
412	273	WB Рязань	2026-03-28 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-03-24 19:52:18.689	2026-03-26 09:50:27.348	\N	boxes	14	83	t	2	2026-03-28 00:00:00
420	384	WB Рязань	2026-03-28 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-03-25 09:59:54.984	2026-03-26 09:50:13.088	\N	boxes	14	83	t	2	2026-03-28 00:00:00
405	265	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-24 11:28:26.944	2026-03-25 10:34:30.598	\N	boxes	1	\N	t	1	\N
295	342	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-19 10:00:05.757	2026-03-25 10:35:37.15	\N	boxes	1	\N	t	1	\N
299	266	WB Курск FBS	2026-03-19 00:00:00	-	\N	0	1. 0.1 x0.31 = 620₽ | Итого: 620₽	done	2026-03-19 12:25:28.821	2026-03-25 10:35:37.152	\N	boxes	1	\N	t	1	\N
400	257	WB Рязань	2026-03-28 00:00:00	-	\N	3	1. Средняя x3 = 2550₽ | Итого: 2550₽	done	2026-03-24 06:55:01.577	2026-04-06 09:10:51.71	\N	boxes	14	2	t	2	2026-03-28 00:00:00
419	375	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 09:45:35.628	2026-03-26 13:33:44.892	\N	boxes	1	\N	t	1	\N
312	375	WB Курск FBS	2026-03-20 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-20 08:19:16.998	2026-03-25 10:35:37.164	\N	boxes	1	\N	t	1	\N
359	297	WB Курск FBS	2026-03-23 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-23 09:57:01.846	2026-03-25 10:35:37.169	\N	boxes	1	\N	t	1	\N
403	262	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-24 07:51:09.318	2026-03-25 10:35:37.17	\N	boxes	1	\N	t	1	\N
408	266	WB Курск FBS	2026-03-24 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Итого: 800₽	done	2026-03-24 12:43:07.472	2026-03-25 10:35:37.172	\N	boxes	1	\N	t	1	\N
452	346	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-03-26 10:36:52.337	2026-03-27 13:09:18.927	\N	boxes	1	3	t	2	2026-03-29 00:00:00
428	303	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	Оставляйте, пожалуйста, заявку на отгрузку. Так же вы можете указывать кол-во коробов, которое вам нужно.	done	2026-03-25 10:37:04.665	2026-03-25 10:40:34.654	\N	boxes	1	\N	t	1	2026-03-24 00:00:00
429	304	WB Тула (Алексин)	2026-03-28 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 10620₽	shipped	2026-03-25 10:40:58.656	2026-03-25 10:49:03.779	\N	pallets	1	\N	t	2	2026-03-27 00:00:00
431	503	WB Электросталь	2026-03-29 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-25 10:54:07.549	2026-03-25 10:57:19.869	\N	boxes	17	3	t	2	2026-03-25 00:00:00
458	270	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	\N	done	2026-03-26 13:42:16.296	2026-03-26 13:42:20.931	\N	boxes	1	\N	t	1	\N
432	503	WB Тула (Алексин)	2026-03-28 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-25 10:54:41.274	2026-03-25 10:57:39.096	\N	boxes	1	2	t	2	2026-03-25 00:00:00
441	292	WB Курск FBS	2026-03-25 00:00:00	-	\N	1	\N	done	2026-03-25 14:32:20.754	2026-03-26 08:40:17.368	\N	boxes	1	\N	t	1	\N
439	512	WB Невинномысск	2026-03-26 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-25 14:13:02.07	2026-03-26 09:43:20.446	\N	boxes	10	3	t	2	2026-03-26 00:00:00
433	342	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 11:29:32.033	2026-03-26 18:02:49.575	\N	boxes	1	\N	t	1	\N
444	439	WB Рязань	2026-03-28 00:00:00	-	\N	1	1. от 0 кг до 300 кг x2 = 12600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x2 | Итого: 13970₽	shipped	2026-03-26 06:58:33.088	2026-03-27 12:11:53.705	\N	pallets	14	\N	t	2	2026-03-27 00:00:00
449	493	WB Электросталь	2026-03-29 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-03-26 09:45:46.339	2026-03-27 13:12:37.715	\N	boxes	17	1	t	2	2026-03-29 00:00:00
450	362	WB Электросталь	2026-03-29 00:00:00	-	\N	1	1. от 301 кг до 400 кг x1 = 7800₽ | Услуги клиента: Забор груза с адреса | Итого: 9150₽	shipped	2026-03-26 10:29:20.182	2026-03-27 13:07:37.42	\N	pallets	17	\N	t	2	2026-03-29 00:00:00
447	347	WB Курск FBS	2026-03-25 00:00:00	-	\N	1	\N	done	2026-03-26 08:49:23.778	2026-03-26 08:49:41.541	\N	boxes	1	\N	t	1	\N
434	250	WB Электросталь	2026-03-29 00:00:00	-	\N	2	1. Средняя x2 = 1780₽ | Итого: 1780₽	shipped	2026-03-25 11:39:05.888	2026-03-26 09:41:54.488	\N	boxes	17	2	t	2	2026-03-25 00:00:00
440	512	WB Электросталь	2026-03-29 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-25 14:14:03.862	2026-03-26 09:43:37.27	\N	boxes	17	3	t	2	2026-03-25 00:00:00
438	493	WB Екатеринбург (Перспективная 14)	2026-03-30 00:00:00	-	\N	1	1. Маленькая x1 = 1000₽ | Итого: 1000₽	shipped	2026-03-25 13:48:19.674	2026-03-26 09:42:27.527	\N	boxes	13	1	t	2	2026-03-30 00:00:00
442	223	WB Курск	2026-03-28 00:00:00	-	\N	5	\N	archived	2026-03-25 17:24:30.99	2026-03-26 10:13:03.624	\N	pallets	2	\N	t	2	\N
437	297	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 12:38:59.057	2026-03-26 18:02:49.58	\N	boxes	1	\N	t	1	\N
435	266	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.51 = 1020₽ | Итого: 1 020₽	done	2026-03-25 12:32:23.133	2026-03-26 13:32:51.873	\N	boxes	1	\N	t	1	\N
454	265	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	4	1. Большая x4 = 3600₽ | Итого: 3600₽	done	2026-03-26 12:41:16.291	2026-03-31 07:46:19.313	\N	boxes	1	3	t	2	2026-03-29 00:00:00
460	265	WB Тула (Алексин)	2026-03-25 00:00:00	-	\N	2	\N	done	2026-03-26 13:46:56.921	2026-03-26 13:47:12.95	\N	boxes	1	3	t	2	\N
445	258	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-26 07:21:11.39	2026-03-26 18:01:49.112	\N	boxes	1	\N	t	1	\N
436	257	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 12:35:37.033	2026-03-26 18:02:49.585	\N	boxes	1	\N	t	1	\N
455	266	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.47 = 940₽ | Итого: 940₽	done	2026-03-26 12:51:28.887	2026-03-26 18:02:49.59	\N	boxes	1	\N	t	1	\N
430	258	WB Курск FBS	2026-03-25 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-25 10:47:33.265	2026-03-26 18:02:49.596	\N	boxes	1	\N	t	1	\N
459	262	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	\N	done	2026-03-26 13:43:04.577	2026-03-26 18:02:49.601	\N	boxes	1	\N	t	1	\N
448	375	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-26 09:31:49.231	2026-03-26 18:02:49.605	\N	boxes	1	\N	t	1	\N
446	281	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-26 08:27:33.422	2026-03-26 18:02:49.609	\N	boxes	1	\N	t	1	\N
456	347	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	\N	done	2026-03-26 13:35:23.496	2026-03-26 18:02:49.614	\N	boxes	1	\N	t	1	\N
457	303	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	\N	done	2026-03-26 13:36:02.259	2026-03-26 18:02:49.617	\N	boxes	1	\N	t	1	\N
453	257	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	1. 0.1 x1 = 2000₽ | Итого: 2 000₽	done	2026-03-26 11:10:44.872	2026-03-26 18:02:49.619	\N	boxes	1	\N	t	1	\N
451	265	WB Курск FBS	2026-03-26 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-26 10:32:17.611	2026-03-26 18:02:49.621	\N	boxes	1	\N	t	1	\N
461	292	WB Курск FBS	2026-03-26 00:00:00	-	\N	1	\N	done	2026-03-26 13:55:44.077	2026-03-26 18:02:49.624	\N	boxes	1	\N	t	1	\N
443	255	WB Курск FBS	2026-03-26 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-03-26 06:35:54.48	2026-03-26 18:02:49.626	\N	boxes	1	\N	t	1	\N
465	402	WB Тула (Алексин)	2026-03-28 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	done	2026-03-27 04:28:45.743	2026-03-31 14:45:40.567	\N	boxes	1	3	t	2	2026-03-27 00:00:00
487	460	WB Новосемейкино	2026-04-02 00:00:00	-	\N	2	1. Большая x2 = 2080₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 2100₽	shipped	2026-03-27 12:41:12.632	2026-04-01 08:47:48.568	\N	boxes	16	3	t	2	2026-03-30 00:00:00
485	304	WB Тула (Алексин)	2026-03-28 00:00:00	-	300	2	\N	shipped	2026-03-27 12:19:03.636	2026-03-27 12:20:28.315	\N	pallets	1	\N	t	2	\N
476	186	WB Тест	2026-03-31 00:00:00	-	\N	1	1. Большая x1 = 10₽ | Итого: 10₽	archived	2026-03-27 10:35:20.237	2026-03-27 10:40:16.235	\N	boxes	24	3	t	2	2026-03-31 00:00:00
464	423	WB Казань	2026-03-27 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-03-26 21:02:29.06	2026-03-27 13:34:33.42	\N	boxes	5	1	t	2	2026-04-03 00:00:00
468	536	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	archived	2026-03-27 07:50:25.666	2026-03-27 13:24:55.795	\N	boxes	1	3	t	2	2026-03-29 00:00:00
482	223	WB Курск	2026-03-27 00:00:00	-	\N	4	\N	archived	2026-03-27 11:50:25.445	2026-03-27 11:55:01.225	\N	pallets	2	\N	t	2	\N
483	223	WB Курск FBS	2026-03-28 00:00:00	-	\N	1	\N	archived	2026-03-27 12:01:07.701	2026-03-27 12:04:12.878	\N	boxes	1	\N	t	1	\N
484	186	WB Курск	2026-04-03 00:00:00	-	0	4	\N	archived	2026-03-27 12:04:27.896	2026-03-27 12:13:59.164	\N	pallets	2	\N	t	2	\N
471	363	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x2 | Итого: 11970₽	shipped	2026-03-27 08:43:42.567	2026-03-27 12:16:31.982	\N	pallets	1	\N	t	2	2025-03-29 00:00:00
478	304	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 10620₽	shipped	2026-03-27 10:59:23.541	2026-03-27 13:13:55.184	\N	pallets	1	\N	t	2	2026-03-29 00:00:00
486	304	WB Тула (Алексин)	2026-03-28 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 10620₽	archived	2026-03-27 12:19:56.821	2026-03-27 12:23:37.605	\N	pallets	1	\N	t	2	2026-03-28 00:00:00
493	558	WB Коледино	2026-03-29 00:00:00	-	\N	1	1. Средняя x1 = 850₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 860₽	shipped	2026-03-27 13:59:39.612	2026-03-30 06:22:13.579	\N	boxes	12	2	t	2	2026-03-29 00:00:00
463	303	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-26 18:35:53.158	2026-03-31 08:07:43.419	\N	boxes	1	\N	t	1	\N
472	363	WB Подольск	2026-03-29 00:00:00	-	\N	8	1. Большая x8 = 7600₽ | Услуги клиента: Помощь на выгрузке x8 | Итого: 7680₽	shipped	2026-03-27 08:45:16.731	2026-03-27 13:10:29.68	\N	boxes	3	3	t	2	2026-03-29 00:00:00
469	389	WB Электросталь	2026-03-29 00:00:00	-	\N	2	1. Большая x2 = 1980₽ | Итого: 1980₽	shipped	2026-03-27 08:11:32.234	2026-03-27 13:18:46.699	\N	boxes	17	3	t	2	2026-03-29 00:00:00
470	535	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-03-27 08:23:54.289	2026-03-27 13:11:28.554	\N	boxes	1	3	t	2	2026-03-29 00:00:00
462	303	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-26 18:35:29.411	2026-03-30 09:30:57.639	\N	boxes	1	\N	t	1	\N
474	426	WB Электросталь	2026-03-29 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-27 08:50:30.031	2026-03-27 13:19:56.694	\N	boxes	17	2	t	2	2026-03-29 00:00:00
494	270	WB Курск FBS	2026-03-27 00:00:00	-	\N	1	\N	done	2026-03-27 14:02:34.627	2026-03-27 18:14:00.158	\N	boxes	1	\N	t	1	\N
473	426	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-27 08:49:35.405	2026-03-27 13:19:39.641	\N	boxes	1	2	t	2	2026-03-29 00:00:00
480	298	WB Котовск	2026-04-01 00:00:00	-	\N	4	1. Большая x4 = 3600₽ | Услуги клиента: Забор груза с адреса | Итого: 4950₽	shipped	2026-03-27 11:22:33.908	2026-03-30 06:37:05.138	\N	boxes	15	3	t	2	2026-04-01 00:00:00
491	266	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.38 = 760₽ | Итого: 760₽	done	2026-03-27 13:13:52.124	2026-03-27 18:14:44.786	\N	boxes	1	\N	t	1	\N
475	375	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-27 09:49:22.082	2026-03-27 18:14:44.789	\N	boxes	1	\N	t	1	\N
492	297	WB Курск	2026-03-28 00:00:00	-	\N	1	1. Средняя x1 = 750₽ | Итого: 750₽	shipped	2026-03-27 13:39:49.089	2026-03-27 13:41:50.163	\N	boxes	2	2	t	2	2026-03-28 00:00:00
495	347	WB Курск FBS	2026-03-27 00:00:00	-	\N	1	\N	done	2026-03-27 14:03:50.154	2026-03-27 18:14:44.791	\N	boxes	1	\N	t	1	\N
489	202	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-27 12:49:17.198	2026-03-27 18:14:44.793	\N	boxes	1	\N	t	1	\N
490	255	WB Курск FBS	2026-03-28 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Услуги клиента: Забор груза с адреса | Итого: 6 500₽	done	2026-03-27 13:09:19.727	2026-03-30 09:19:26.386	\N	boxes	1	\N	t	1	\N
466	346	WB Краснодар	2026-04-02 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Итого: 5250₽	shipped	2026-03-27 07:04:29.352	2026-04-03 12:00:03.388	\N	boxes	8	83	t	2	2026-04-02 00:00:00
481	346	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-03 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5500₽ | Итого: 5500₽	shipped	2026-03-27 11:35:33.229	2026-04-09 10:54:07.697	\N	boxes	21	83	t	2	2026-04-02 00:00:00
479	258	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-27 11:13:43.905	2026-03-27 18:14:44.796	\N	boxes	1	\N	t	1	\N
488	257	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-27 12:43:28.32	2026-03-27 18:14:44.798	\N	boxes	1	\N	t	1	\N
467	281	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-27 07:21:44.431	2026-03-27 18:14:44.8	\N	boxes	1	\N	t	1	\N
477	342	WB Курск FBS	2026-03-27 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-27 10:53:03.462	2026-03-27 18:14:44.802	\N	boxes	1	\N	t	1	\N
496	292	WB Курск FBS	2026-03-27 00:00:00	-	\N	1	\N	done	2026-03-27 14:08:25.123	2026-03-27 18:14:44.804	\N	boxes	1	\N	t	1	\N
531	245	WB Электросталь	2026-04-01 00:00:00	-	\N	2	1. Большая x2 = 1980₽ | Итого: 1980₽	shipped	2026-03-29 19:16:21.495	2026-04-01 13:08:33.781	\N	boxes	17	3	t	2	2026-04-01 00:00:00
503	266	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.32 = 640₽ | Итого: 640₽	done	2026-03-28 10:44:40.589	2026-03-30 09:29:03.211	\N	boxes	1	\N	t	1	\N
500	223	WB Курск FBS	2026-03-30 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-03-28 09:07:40.855	2026-03-28 10:10:17.529	\N	boxes	1	\N	t	1	\N
499	258	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-28 08:27:45.941	2026-03-30 09:29:57.583	\N	boxes	1	\N	t	1	\N
498	281	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-28 08:20:06.974	2026-03-30 09:24:30.869	\N	boxes	1	\N	t	1	\N
501	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	5	1. 0.1 x5 = 10000₽ | Итого: 10 000₽	archived	2026-03-28 09:14:34.461	2026-03-28 13:43:14.682	\N	boxes	1	\N	t	1	\N
502	375	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-28 09:46:52.777	2026-03-30 09:24:10.118	\N	boxes	1	\N	t	1	\N
515	223	WB Курск FBS	2026-03-30 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-03-28 14:32:30.953	2026-03-28 14:33:01.759	0.3	boxes	1	\N	t	1	\N
509	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 1 340₽	archived	2026-03-28 13:59:23.421	2026-03-28 14:01:59.933	\N	boxes	1	\N	t	1	\N
508	223	WB Казань	2026-04-17 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	archived	2026-03-28 13:44:20.653	2026-03-28 14:02:02.806	\N	boxes	5	2	t	2	2026-03-28 00:00:00
507	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-03-28 13:44:09.107	2026-03-28 14:02:07.144	\N	boxes	1	\N	t	1	\N
506	186	WB Курск	2026-04-02 00:00:00	-	\N	3	1. Средняя x3 = 2250₽ | Итого: 2250₽	archived	2026-03-28 13:38:29.165	2026-03-28 14:02:09.752	\N	boxes	2	2	t	2	2026-03-30 00:00:00
505	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	archived	2026-03-28 13:37:20.504	2026-03-28 14:02:12.09	\N	boxes	1	\N	t	1	\N
513	223	WB Курск FBS	2026-03-30 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-03-28 14:15:45.867	2026-03-28 14:33:04.345	0.3	boxes	1	\N	t	1	\N
514	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-03-28 14:32:18.186	2026-03-28 14:33:06.592	0.2	boxes	1	\N	t	1	\N
528	223	WB Курск FBS	2026-03-24 00:00:00	-	\N	1	\N	archived	2026-03-29 15:12:54.724	2026-03-29 16:27:23.817	\N	boxes	1	\N	t	1	\N
512	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-03-28 14:12:53.473	2026-03-28 14:33:08.649	0.3	boxes	1	\N	t	1	\N
520	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.55 = 1100₽ | Итого: 1 100₽	archived	2026-03-28 14:54:54.699	2026-03-28 14:57:22.557	15	boxes	1	\N	t	1	\N
511	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	4	1. 0.1 x4 = 8000₽ | Итого: 8 000₽	archived	2026-03-28 14:09:14.387	2026-03-28 14:33:11.536	0.1	boxes	1	\N	t	1	\N
510	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Услуги клиента: Помощь на выгрузке | Итого: 1 050₽	archived	2026-03-28 14:03:54.596	2026-03-28 14:33:21.687	\N	boxes	1	\N	t	1	\N
519	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	6	1. 0.1 x6 = 12000₽ | Итого: 12 000₽	archived	2026-03-28 14:53:10.261	2026-03-28 14:57:26.442	1	boxes	1	\N	t	1	\N
516	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Итого: 1 000₽	archived	2026-03-28 14:37:53.555	2026-03-28 14:43:24.742	0.05	boxes	1	\N	t	1	\N
518	223	WB Курск FBS	2026-03-30 00:00:00	-	\N	5	1. 0.1 x5 = 10000₽ | Итого: 10 000₽	archived	2026-03-28 14:46:09.616	2026-03-28 14:57:28.802	0.5	boxes	1	\N	t	1	\N
521	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Итого: 800₽	archived	2026-03-28 14:58:00.789	2026-03-29 10:41:34.664	0.4	boxes	1	\N	t	1	\N
517	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	4	1. 0.1 x4 = 8000₽ | Итого: 8 000₽	archived	2026-03-28 14:44:38.721	2026-03-28 14:57:31.568	0.4	boxes	1	\N	t	1	\N
523	186	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Итого: 1 000₽	archived	2026-03-28 15:20:56.19	2026-03-29 08:51:04.843	0.5	boxes	1	\N	t	1	\N
530	223	WB Курск FBS	2026-03-31 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-03-29 16:51:34.873	2026-03-29 17:17:05.208	3	boxes	1	\N	t	1	\N
526	186	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	archived	2026-03-29 10:42:07.092	2026-03-29 17:16:53.215	0.7	boxes	1	\N	t	1	\N
504	297	WB Курск FBS	2026-03-28 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-28 13:35:14.344	2026-03-30 09:23:20.602	\N	boxes	1	\N	t	1	\N
522	186	WB Курск FBS	2026-03-30 00:00:00	-	\N	5	1. 0.1 x5 = 10000₽ | Итого: 10 000₽	archived	2026-03-28 15:03:16.746	2026-03-29 17:16:57.665	0.1	boxes	1	\N	t	1	\N
497	430	WB Тула (Алексин)	2026-03-29 00:00:00	-	\N	1	1. от 301 кг до 400 кг x1 = 6350₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 6360₽	shipped	2026-03-27 21:02:58.349	2026-03-30 06:23:20.068	\N	pallets	1	\N	t	2	2026-03-29 00:00:00
524	255	WB Курск FBS	2026-03-30 00:00:00	-	\N	2	1. 0.1 x2.5 = 5000₽ | Услуги клиента: Забор груза с адреса | Итого: 5 500₽	done	2026-03-29 07:47:54.323	2026-03-31 07:45:08.54	2.5	boxes	1	\N	t	1	\N
533	245	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-03-29 19:17:36.279	2026-04-01 08:48:14.866	\N	boxes	16	3	t	2	2026-04-02 00:00:00
534	615	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-03-30 06:24:36.723	2026-04-01 08:48:55.769	\N	boxes	16	1	t	2	2026-04-02 00:00:00
535	346	WB Воронеж	2026-04-01 00:00:00	-	\N	3	1. Большая x3 = 2550₽ | Итого: 2550₽	shipped	2026-03-30 06:25:15.135	2026-04-03 12:05:50.35	\N	boxes	7	3	t	2	2026-04-01 00:00:00
532	245	WB Электросталь	2026-04-01 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-29 19:17:11.826	2026-04-01 13:09:46.865	\N	boxes	17	3	t	2	2026-04-02 00:00:00
525	255	WB Курск FBS	2026-03-31 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-03-29 07:48:04.829	2026-04-02 09:40:30.528	2	boxes	1	\N	t	1	\N
565	262	WB Курск FBS	2026-03-28 00:00:00	-	\N	1	\N	done	2026-03-30 09:34:02.672	2026-03-30 09:34:14.38	\N	boxes	1	\N	t	1	\N
544	192	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 710₽	archived	2026-03-30 07:00:02.401	2026-03-30 09:10:45.526	0.1	boxes	1	\N	t	1	\N
529	192	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-29 16:30:16.149	2026-03-30 09:10:54.877	0.1	boxes	1	\N	t	1	\N
564	292	WB Курск FBS	2026-03-28 00:00:00	-	\N	1	\N	done	2026-03-30 09:27:55.367	2026-03-30 09:28:08.749	\N	boxes	1	\N	t	1	\N
567	342	WB Курск FBS	2026-03-28 00:00:00	-	\N	1	\N	done	2026-03-30 09:36:15.924	2026-03-30 09:36:23.493	\N	boxes	1	\N	t	1	\N
569	303	WB Курск FBS	2026-03-18 00:00:00	-	\N	1	Счет за доставку от 18.03	done	2026-03-30 10:02:37.478	2026-03-30 10:03:10.448	\N	boxes	1	\N	t	1	\N
570	192	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-30 10:17:31.833	2026-03-31 08:53:42.252	0.1	boxes	1	\N	t	1	\N
568	363	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 5300₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x1 | Итого: 6660₽	shipped	2026-03-30 09:45:09.607	2026-03-31 10:55:04.946	\N	pallets	1	\N	t	2	2026-04-01 00:00:00
547	342	WB Рязань	2026-04-04 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 8400₽ | Итого: 8400₽	shipped	2026-03-30 07:12:02.612	2026-03-31 07:36:44.796	\N	pallets	14	\N	t	2	2026-04-04 00:00:00
543	430	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. от 301 кг до 400 кг x1 = 8900₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 8910₽	shipped	2026-03-30 06:59:22.845	2026-03-31 07:45:06.364	\N	pallets	10	\N	t	2	2026-04-03 00:00:00
539	621	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 7900₽ | Итого: 7900₽	shipped	2026-03-30 06:43:27.716	2026-03-31 07:49:15.854	\N	pallets	10	\N	t	2	2026-04-02 00:00:00
545	342	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.09 = 180₽ | Итого: 180₽	done	2026-03-30 07:01:56.002	2026-03-31 08:04:33.759	0.09	boxes	1	\N	t	1	\N
566	375	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-30 09:35:12.35	2026-03-31 08:00:37.023	0.1	boxes	1	\N	t	1	\N
551	281	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-30 07:49:01.358	2026-03-31 08:01:23.977	0.2	boxes	1	\N	t	1	\N
540	439	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 7900₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x1 | Итого: 9260₽	shipped	2026-03-30 06:46:13.312	2026-04-01 08:28:30.268	\N	pallets	10	\N	t	2	2026-03-30 00:00:00
559	535	WB Невинномысск	2026-04-02 00:00:00	-	\N	2	1. Средняя x2 = 1780₽ | Итого: 1780₽	shipped	2026-03-30 07:58:39.628	2026-04-01 08:33:25.36	\N	boxes	10	2	t	2	2026-04-02 00:00:00
571	384	WB Невинномысск	2026-04-02 00:00:00	-	\N	4	1. Большая x4 = 3960₽ | Итого: 3960₽	shipped	2026-03-30 11:03:46.34	2026-04-01 08:33:55.274	\N	boxes	10	3	t	2	2026-04-02 00:00:00
562	402	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-30 08:33:30.97	2026-04-01 08:34:13.039	\N	boxes	10	3	t	2	2026-04-02 00:00:00
548	631	WB Невинномысск	2026-04-02 00:00:00	-	\N	4	1. Маленькая x4 = 3160₽ | Услуги клиента: Помощь на выгрузке x4 | Итого: 3200₽	shipped	2026-03-30 07:36:57.821	2026-04-01 08:36:14.028	\N	boxes	10	1	t	2	2026-04-02 00:00:00
550	269	WB Новосемейкино	2026-04-02 00:00:00	-	\N	2	1. Средняя x2 = 1880₽ | Итого: 1880₽	shipped	2026-03-30 07:47:27.927	2026-04-01 08:49:31.324	\N	boxes	16	2	t	2	2026-04-02 00:00:00
555	436	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-03-30 07:51:49.986	2026-04-01 08:50:05.637	\N	boxes	16	1	t	2	2026-03-30 00:00:00
572	384	WB Новосемейкино	2026-04-02 00:00:00	-	\N	4	1. Большая x4 = 4160₽ | Итого: 4160₽	shipped	2026-03-30 11:04:27.827	2026-04-01 08:50:24.237	\N	boxes	16	3	t	2	2026-04-02 00:00:00
536	615	WB Краснодар	2026-04-03 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-03-30 06:26:53.54	2026-04-01 09:00:28.038	\N	boxes	8	1	t	2	0026-04-02 00:00:00
554	436	WB Краснодар	2026-04-03 00:00:00	-	\N	2	1. Маленькая x2 = 1580₽ | Итого: 1580₽	shipped	2026-03-30 07:51:26.202	2026-04-01 09:01:11.154	\N	boxes	8	1	t	2	2026-03-30 00:00:00
556	436	WB Котовск	2026-04-01 00:00:00	-	\N	2	1. Маленькая x2 = 1400₽ | Итого: 1400₽	shipped	2026-03-30 07:52:19.298	2026-04-01 10:11:35.865	\N	boxes	15	1	t	2	2026-03-30 00:00:00
552	269	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. Средняя x1 = 1100₽ | Итого: 1100₽	shipped	2026-03-30 07:50:39.746	2026-04-01 12:21:05.194	\N	boxes	13	2	t	2	2026-04-06 00:00:00
553	436	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. Маленькая x1 = 1000₽ | Итого: 1000₽	shipped	2026-03-30 07:50:56.329	2026-04-01 12:21:34.986	\N	boxes	13	1	t	2	2026-03-30 00:00:00
542	241	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-03 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-03-30 06:52:22.388	2026-04-01 12:39:16.001	\N	boxes	21	3	t	2	2026-04-02 00:00:00
549	269	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	2	1. Средняя x2 = 1600₽ | Итого: 1600₽	shipped	2026-03-30 07:46:35.527	2026-04-01 12:59:28.472	\N	boxes	1	2	t	2	2026-04-01 00:00:00
558	436	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. Маленькая x1 = 700₽ | Итого: 700₽	shipped	2026-03-30 07:53:10.265	2026-04-01 13:01:08.539	\N	boxes	1	1	t	2	2026-03-30 00:00:00
538	613	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 910₽	shipped	2026-03-30 06:28:57.554	2026-04-01 13:03:24.794	\N	boxes	1	3	t	2	2026-04-01 00:00:00
561	402	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-30 08:32:13.109	2026-04-01 13:04:59.481	\N	boxes	1	2	t	2	2026-04-01 00:00:00
563	648	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	2	1. Большая x2 = 1800₽ | Итого: 1800₽	shipped	2026-03-30 08:47:52.138	2026-04-01 13:05:13.49	\N	boxes	1	3	t	2	2026-04-01 00:00:00
537	615	WB Коледино	2026-04-01 00:00:00	-	\N	1	1. Маленькая x1 = 750₽ | Итого: 750₽	shipped	2026-03-30 06:27:30.805	2026-04-01 13:08:06.947	\N	boxes	12	1	t	2	2026-04-01 00:00:00
541	241	WB Электросталь	2026-04-01 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-30 06:51:38.052	2026-04-01 13:10:26.791	\N	boxes	17	3	t	2	2026-04-01 00:00:00
557	436	WB Электросталь	2026-04-01 00:00:00	-	\N	2	1. Маленькая x2 = 1580₽ | Итого: 1580₽	shipped	2026-03-30 07:52:36.812	2026-04-01 13:11:10.9	\N	boxes	17	1	t	2	2026-03-30 00:00:00
560	471	WB Электросталь	2026-04-01 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-30 08:02:23.679	2026-04-01 13:11:37.764	\N	boxes	17	3	t	2	2026-04-01 00:00:00
580	663	WB Котовск	2026-04-01 00:00:00	-	\N	2	1. Большая x2 = 1800₽ | Итого: 1800₽	shipped	2026-03-30 12:24:30.549	2026-04-01 10:12:16.449	\N	boxes	15	3	t	2	2026-04-01 00:00:00
601	303	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-31 07:36:48.658	2026-04-06 09:59:06.328	0.3	boxes	1	\N	t	1	\N
579	265	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.26 = 520₽ | Итого: 520₽	done	2026-03-30 12:11:38.308	2026-03-31 07:46:38.451	0.26	boxes	1	\N	t	1	\N
573	655	WB Новосемейкино	2026-04-02 00:00:00	-	\N	2	\N	shipped	2026-03-30 11:27:38.065	2026-03-31 07:22:05.78	\N	boxes	10	3	t	2	2026-03-30 00:00:00
590	262	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-30 13:24:59.616	2026-03-31 07:47:26.033	0.1	boxes	1	\N	t	1	\N
575	655	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	4	1. Средняя x4 = 4400₽ | Итого: 4400₽	shipped	2026-03-30 11:30:50.333	2026-03-31 07:31:32.816	\N	boxes	13	2	t	2	2026-03-30 00:00:00
574	655	WB Краснодар	2026-04-03 00:00:00	-	\N	4	1. Большая x2 = 1980₽; 2. Коробка x2 = 0₽ | Итого: 1980₽	shipped	2026-03-30 11:29:50.115	2026-03-31 07:24:19.264	\N	boxes	8	3	t	2	2026-03-30 00:00:00
589	266	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.7 = 1400₽ | Итого: 1 400₽	done	2026-03-30 13:22:37.401	2026-03-31 07:48:02.372	0.7	boxes	1	\N	t	1	\N
546	342	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 7400₽ | Услуги клиента: Забор груза с адреса | Итого: 8750₽	shipped	2026-03-30 07:08:00.132	2026-03-31 07:36:04.275	\N	pallets	1	\N	t	2	2026-04-01 00:00:00
578	258	WB Курск FBS	2026-03-30 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-30 12:09:46.07	2026-03-31 07:48:43.251	0.1	boxes	1	\N	t	1	\N
599	303	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-31 07:35:52.923	2026-04-02 09:55:48.952	0.3	boxes	1	\N	t	1	\N
608	347	WB Курск FBS	2026-03-30 00:00:00	-	\N	1	\N	done	2026-03-31 08:02:19.807	2026-03-31 08:02:24.885	\N	boxes	1	\N	t	1	\N
611	292	WB Курск FBS	2026-03-30 00:00:00	-	\N	1	\N	done	2026-03-31 08:05:24.039	2026-03-31 08:05:30.351	\N	boxes	1	\N	t	1	\N
606	198	WB Новосемейкино	2026-04-02 00:00:00	-	\N	25	1. Маленькая x25 = 21000₽ | Услуги клиента: Забор груза с адреса | Итого: 22350₽	shipped	2026-03-31 08:00:05.835	2026-03-31 08:09:41.285	\N	boxes	16	1	t	2	2026-04-02 00:00:00
598	273	WB Сарапул	2026-04-05 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 6500₽ | Итого: 6500₽	shipped	2026-03-31 07:27:01.257	2026-03-31 10:37:28.85	\N	boxes	4	83	t	2	2026-04-05 00:00:00
597	273	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 7500₽ | Итого: 7500₽	shipped	2026-03-31 07:26:03.451	2026-03-31 10:37:59.981	\N	boxes	13	83	t	2	2026-04-06 00:00:00
582	663	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-03-30 12:30:56.306	2026-04-01 08:35:04.928	\N	boxes	10	3	t	2	2026-04-02 00:00:00
576	270	WB Невинномысск	2026-04-02 00:00:00	-	\N	23	1. Большая x23 = 22770₽ | Итого: 22770₽	shipped	2026-03-30 11:40:09.801	2026-04-01 08:30:20.158	\N	boxes	10	3	t	2	2026-03-30 00:00:00
587	291	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-03-30 12:59:45.473	2026-04-01 08:53:29.257	\N	boxes	16	2	t	2	2026-04-02 00:00:00
591	316	WB Новосемейкино	2026-04-02 00:00:00	-	\N	3	1. Большая x2 = 2080₽; 2. Средняя x1 = 940₽ | Итого: 3020₽	warehouse	2026-03-30 16:54:53.727	2026-04-06 09:14:34.807	\N	boxes	16	3	t	2	2026-04-02 00:00:00
583	285	WB Краснодар	2026-04-03 00:00:00	-	\N	2	1. Большая x2 = 1980₽ | Итого: 1980₽	shipped	2026-03-30 12:45:20.58	2026-04-01 09:01:32.433	\N	boxes	8	3	t	2	2026-04-03 00:00:00
588	423	WB Краснодар	2026-04-03 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-03-30 13:01:51.587	2026-04-01 09:02:00.885	\N	boxes	8	1	t	2	2026-04-03 00:00:00
603	262	WB Курск FBS	2026-03-31 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 07:49:22.72	2026-04-02 09:51:59.958	0.1	boxes	1	\N	t	1	\N
607	674	WB Котовск	2026-04-01 00:00:00	-	\N	6	1. Маленькая x6 = 4200₽ | Итого: 4200₽	shipped	2026-03-31 08:01:29.496	2026-04-01 10:54:20.958	\N	boxes	15	1	t	2	2026-04-01 00:00:00
609	674	WB Казань	2026-04-03 00:00:00	-	\N	5	1. Маленькая x5 = 4200₽ | Итого: 4200₽	shipped	2026-03-31 08:02:48.295	2026-04-01 10:53:52.463	\N	boxes	5	1	t	2	2026-04-03 00:00:00
594	297	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. Средняя x1 = 1100₽ | Итого: 1100₽	shipped	2026-03-31 07:20:16.007	2026-04-01 12:22:08.833	\N	boxes	13	2	t	2	2026-04-06 00:00:00
596	241	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. Большая x1 = 1200₽ | Итого: 1200₽	shipped	2026-03-31 07:24:59.209	2026-04-01 12:22:46.543	\N	boxes	13	3	t	2	2026-04-06 00:00:00
585	250	WB Сарапул	2026-04-05 00:00:00	-	\N	3	1. Средняя x3 = 3000₽ | Итого: 3000₽	shipped	2026-03-30 12:57:52.825	2026-04-01 12:36:48.412	\N	boxes	4	2	t	2	2026-04-05 00:00:00
595	297	WB Сарапул	2026-04-05 00:00:00	-	\N	1	1. Средняя x1 = 1000₽ | Итого: 1000₽	shipped	2026-03-31 07:20:45.734	2026-04-01 12:36:55.295	\N	boxes	4	2	t	2	2026-04-05 00:00:00
586	291	WB Волгоград	2026-04-03 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-03-30 12:58:44.086	2026-04-01 12:37:46.179	\N	boxes	9	2	t	2	2026-04-03 00:00:00
593	350	WB Волгоград	2026-04-03 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Итого: 5250₽	shipped	2026-03-30 19:48:54.335	2026-04-01 12:38:50.947	\N	boxes	9	83	t	2	2026-04-03 00:00:00
584	291	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-03-30 12:57:34.141	2026-04-01 12:53:20.065	\N	boxes	1	2	t	2	2026-04-01 00:00:00
577	631	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	4	1. Маленькая x4 = 2800₽ | Услуги клиента: Помощь на выгрузке x4 | Итого: 2840₽	shipped	2026-03-30 11:41:14.715	2026-04-01 13:02:02.072	\N	boxes	1	1	t	2	2026-04-01 00:00:00
581	663	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	2	1. Большая x2 = 1800₽ | Итого: 1800₽	shipped	2026-03-30 12:30:24.62	2026-04-01 13:02:14.239	\N	boxes	1	3	t	2	2026-04-01 00:00:00
600	303	WB Курск FBS	2026-04-02 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-03-31 07:36:31.916	2026-04-02 16:28:15.284	0.2	boxes	1	\N	t	1	\N
604	281	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 07:55:33.798	2026-04-02 09:42:47.451	0.1	boxes	1	\N	t	1	\N
610	674	WB Рязань	2026-04-04 00:00:00	-	\N	2	1. Маленькая x2 = 1500₽ | Итого: 1500₽	shipped	2026-03-31 08:05:07.772	2026-04-03 12:09:30.587	\N	boxes	14	1	t	2	2026-04-04 00:00:00
690	223	WB Курск	2026-05-02 00:00:00	-	0.2	1	\N	archived	2026-04-02 16:33:45.732	2026-04-02 16:34:07.442	\N	boxes	2	\N	t	2	\N
602	303	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.3 = 600₽ | Итого: 600₽	done	2026-03-31 07:36:59.731	2026-04-06 09:59:23.706	0.3	boxes	1	\N	t	1	\N
613	376	WB Курск FBS	2026-03-30 00:00:00	-	\N	1	\N	done	2026-03-31 08:07:11.843	2026-03-31 08:07:16.912	\N	boxes	1	\N	t	1	\N
605	198	WB Воронеж	2026-04-01 00:00:00	-	\N	2	1. Маленькая x2 = 1300₽ | Итого: 1300₽	shipped	2026-03-31 07:57:33.348	2026-03-31 08:07:56.629	\N	boxes	7	1	t	2	2026-04-02 00:00:00
626	709	WB Рязань	2026-04-04 00:00:00	-	\N	1	1. Средняя x1 = 850₽ | Итого: 850₽	shipped	2026-03-31 11:53:40.113	2026-04-03 12:11:18.375	\N	boxes	14	2	t	2	2026-03-04 00:00:00
630	266	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.46 = 920₽ | Итого: 920₽	done	2026-03-31 12:29:23.037	2026-04-02 09:38:29.14	0.46	boxes	1	\N	t	1	\N
642	202	WB Котовск	2026-04-08 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-04-01 11:14:53.423	2026-04-01 11:38:48.86	\N	boxes	15	3	t	2	2026-04-02 00:00:00
612	670	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 14000₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 14010₽	shipped	2026-03-31 08:05:31.056	2026-03-31 08:15:53.435	\N	pallets	13	\N	t	2	2026-04-06 00:00:00
615	255	WB Курск FBS	2026-03-31 00:00:00	-	\N	1	\N	archived	2026-03-31 08:18:19.545	2026-03-31 08:18:29.157	\N	boxes	1	\N	t	1	\N
634	269	WB Краснодар	2026-04-03 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-04-01 09:05:50.061	2026-04-01 10:10:14.165	\N	boxes	8	2	t	2	2026-04-03 00:00:00
625	709	WB Котовск	2026-04-08 00:00:00	-	\N	2	1. Средняя x1 = 800₽; 2. Коробка x1 = 0₽ | Итого: 800₽	shipped	2026-03-31 11:52:56.925	2026-04-10 08:50:13.363	\N	boxes	15	2	t	2	2026-03-08 00:00:00
641	263	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-04-01 11:14:01.882	2026-04-02 09:51:29.201	0.2	boxes	1	\N	t	1	\N
614	223	WB Котовск	2026-04-15 00:00:00	-	\N	5	1. Маленькая x1 = 700₽ | Итого: 700₽	archived	2026-03-31 08:08:15.465	2026-03-31 10:04:59.28	\N	pallets	15	2	t	2	2026-03-31 00:00:00
629	709	WB Курск	2026-04-04 00:00:00	-	\N	1	1. Средняя x1 = 750₽ | Итого: 750₽	shipped	2026-03-31 11:55:58.224	2026-04-03 12:18:24.263	\N	boxes	2	2	t	2	2026-03-04 00:00:00
627	709	WB Новосемейкино	2026-04-09 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-03-31 11:54:41.196	2026-04-08 07:55:55.126	\N	boxes	16	2	t	2	2026-03-09 00:00:00
635	375	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-04-01 09:20:37.114	2026-04-02 09:52:57.923	0.2	boxes	1	\N	t	1	\N
619	192	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 09:19:38.471	2026-04-02 09:55:15.543	0.1	boxes	1	\N	t	1	\N
645	266	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.42 = 840₽ | Итого: 840₽	done	2026-04-01 12:57:51.691	2026-04-02 09:38:52.576	0.42	boxes	1	\N	t	1	\N
644	265	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-01 12:41:27.107	2026-04-02 09:44:56.005	0.1	boxes	1	\N	t	1	\N
638	281	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-04-01 09:55:06.374	2026-04-02 09:43:00.53	0.2	boxes	1	\N	t	1	\N
618	342	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.05 = 100₽ | Итого: 100₽	done	2026-03-31 09:06:49.534	2026-04-02 09:56:45.46	0.05	boxes	1	\N	t	1	\N
646	304	WB Тула (Алексин)	2026-04-03 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 10600₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 10620₽	shipped	2026-04-01 14:55:36.99	2026-04-02 07:34:38.595	\N	pallets	1	\N	t	2	2026-04-01 00:00:00
620	375	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 09:25:14.107	2026-04-02 09:52:50.682	0.1	boxes	1	\N	t	1	\N
623	285	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	4	1. Большая x4 = 4800₽ | Итого: 4800₽	shipped	2026-03-31 10:56:11.98	2026-04-01 12:23:45.463	\N	boxes	13	3	t	2	2026-04-06 00:00:00
643	202	WB Новосемейкино	2026-04-02 00:00:00	-	\N	7	1. Большая x7 = 7280₽ | Итого: 7280₽	shipped	2026-04-01 11:16:29.634	2026-04-01 11:39:24.952	\N	boxes	16	3	t	2	2026-04-03 00:00:00
622	265	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 10:26:09.184	2026-04-02 09:44:37.408	0.1	boxes	1	\N	t	1	\N
621	202	WB Курск FBS	2026-03-31 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-03-31 09:55:19.084	2026-04-02 09:54:44.925	0.1	boxes	1	\N	t	1	\N
527	606	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	4	1. Средняя x4 = 3200₽ | Услуги клиента: Помощь на выгрузке x4 | Итого: 3240₽	shipped	2026-03-29 14:56:01.082	2026-04-01 13:04:44.077	\N	boxes	1	2	t	2	2026-04-01 00:00:00
616	292	WB Курск FBS	2026-03-31 00:00:00	-	\N	1	\N	done	2026-03-31 08:18:55.125	2026-04-02 09:41:39.99	\N	boxes	1	\N	t	1	\N
639	192	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-01 10:13:21.978	2026-04-01 15:04:21.791	0.1	boxes	1	\N	t	1	\N
617	700	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-03-31 09:05:11.816	2026-04-01 13:06:59.959	\N	boxes	1	3	t	2	2026-04-01 00:00:00
624	265	WB Тула (Алексин)	2026-04-01 00:00:00	-	\N	5	1. Большая x5 = 4500₽ | Итого: 4500₽	done	2026-03-31 11:02:45.135	2026-04-02 09:45:28.063	\N	boxes	1	3	t	2	2026-04-01 00:00:00
636	613	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 910₽	archived	2026-04-01 09:22:23.459	2026-04-01 13:07:27.813	\N	boxes	1	3	t	2	2026-04-05 00:00:00
637	262	WB Курск FBS	2026-04-01 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-01 09:27:08.279	2026-04-02 09:52:09.061	0.1	boxes	1	\N	t	1	\N
640	192	WB Курск FBS	2026-04-01 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-01 10:16:57.925	2026-04-01 15:04:21.795	0.2	boxes	1	\N	t	1	\N
648	614	WB Электросталь	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-01 15:37:27.541	2026-04-02 07:33:52.369	\N	boxes	17	3	t	2	2026-04-01 00:00:00
647	614	WB Тула (Алексин)	2026-04-03 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-01 15:36:00.576	2026-04-02 07:34:05.929	\N	boxes	1	3	t	2	2026-04-01 00:00:00
592	315	WB Волгоград	2026-04-03 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5250₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 5260₽	archived	2026-03-30 19:23:15.409	2026-04-02 09:27:09.48	\N	boxes	9	83	t	2	2026-04-03 00:00:00
632	270	WB Курск	2026-04-04 00:00:00	-	\N	6	1. Большая x6 = 5100₽ | Итого: 5100₽	shipped	2026-03-31 18:14:06.632	2026-04-03 12:18:46.925	\N	boxes	2	3	t	2	2026-04-05 00:00:00
633	270	WB Щербинка	2026-04-05 00:00:00	-	\N	12	1. Большая x12 = 0₽ | Итого: 0₽	shipped	2026-03-31 18:15:52.402	2026-04-03 12:28:39.277	\N	boxes	25	3	t	2	2026-03-06 00:00:00
631	716	ОZON Воронеж	2026-04-08 00:00:00	-	\N	4	1. Палета x4 = 0₽ | Итого: 0₽	new	2026-03-31 14:00:44.805	2026-04-09 07:50:29.351	\N	pallets	30	\N	t	2	2026-04-09 00:00:00
628	709	WB Краснодар	2026-04-10 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	warehouse	2026-03-31 11:55:17.822	2026-04-10 08:28:38.701	\N	boxes	8	2	t	2	2026-03-10 00:00:00
654	255	WB Курск FBS	2026-04-03 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-01 16:32:58.235	2026-04-03 15:19:23.453	2	boxes	1	\N	t	1	\N
652	255	WB Курск FBS	2026-04-01 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-01 16:32:28.133	2026-04-02 09:37:59.462	2	boxes	1	\N	t	1	\N
687	363	Lamoda  Софьино	2026-04-04 00:00:00	-	\N	15	1. Большая x15 = 14250₽ | Итого: 14250₽	new	2026-04-02 16:12:24.401	2026-04-02 16:12:24.401	\N	boxes	29	3	f	2	2026-04-04 00:00:00
659	738	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-04-01 19:28:29.18	2026-04-02 07:30:19.833	\N	boxes	16	2	t	2	2026-04-02 00:00:00
658	738	WB Казань	2026-04-03 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-04-01 19:26:52.752	2026-04-02 07:30:47.654	\N	boxes	5	2	t	2	2026-04-04 00:00:00
666	292	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 09:42:08.098	2026-04-02 09:42:11.925	\N	boxes	1	\N	t	1	\N
657	738	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-04-01 19:25:01.041	2026-04-02 07:31:09.211	\N	boxes	16	2	t	2	2026-04-02 00:00:00
656	749	WB Тула (Алексин)	2026-04-03 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 5300₽ | Итого: 5300₽	shipped	2026-04-01 17:56:37.691	2026-04-03 12:14:57.332	\N	pallets	1	\N	t	2	2026-04-03 00:00:00
650	614	WB Невинномысск	2026-04-02 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-04-01 15:38:56.944	2026-04-02 07:31:48.333	\N	boxes	10	2	t	2	2026-04-02 00:00:00
667	342	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 10:01:01.216	2026-04-02 10:01:15.144	\N	boxes	1	\N	t	1	\N
649	614	WB Екатеринбург (Перспективная 14)	2026-04-06 00:00:00	-	\N	1	1. Большая x1 = 1200₽ | Итого: 1200₽	shipped	2026-04-01 15:38:17.787	2026-04-02 07:32:06.279	\N	boxes	13	3	t	2	2026-04-06 00:00:00
651	614	WB Новосемейкино	2026-04-02 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Итого: 940₽	shipped	2026-04-01 15:39:27.123	2026-04-02 07:32:38.13	\N	boxes	16	2	t	2	2026-04-02 00:00:00
669	764	WB Электросталь	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 1000₽	archived	2026-04-02 10:03:51.919	2026-04-03 12:25:50.204	\N	boxes	17	3	t	2	2026-04-05 00:00:00
668	347	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 10:03:19.773	2026-04-02 10:03:24.089	\N	boxes	1	\N	t	1	\N
672	316	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 10:40:41.792	2026-04-02 10:41:32.508	\N	boxes	1	\N	t	1	\N
674	368	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 11:09:38.321	2026-04-02 11:09:44.187	\N	boxes	1	\N	t	1	\N
675	486	WB Курск FBS	2026-04-01 00:00:00	-	\N	1	\N	done	2026-04-02 11:11:14.693	2026-04-02 11:11:18.444	\N	boxes	1	\N	t	1	\N
670	285	WB Электросталь	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-02 10:29:46.692	2026-04-03 12:25:56.921	\N	boxes	17	3	t	2	2026-04-05 00:00:00
673	757	WB Краснодар	2026-04-03 00:00:00	-	\N	7	1. от 5 до 10 коробок x7 = 36750₽ | Услуги клиента: Помощь на выгрузке x7 | Итого: 36820₽	shipped	2026-04-02 10:44:31.192	2026-04-02 13:25:15.635	\N	boxes	8	83	t	2	2026-04-02 00:00:00
660	262	WB Курск FBS	2026-04-02 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-02 06:35:35.471	2026-04-02 16:19:39.352	0.1	boxes	1	\N	t	1	\N
680	493	WB Краснодар	2026-04-10 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-04-02 12:36:20.283	2026-04-10 08:25:51.031	\N	boxes	8	1	t	2	2026-04-10 00:00:00
665	375	WB Курск FBS	2026-04-02 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-02 09:41:43.46	2026-04-02 16:10:43.443	0.1	boxes	1	\N	t	1	\N
676	724	WB Курск FBS	2026-04-02 00:00:00	-	\N	1	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-02 11:44:54.632	2026-04-06 08:55:27.541	0.1	boxes	1	\N	t	1	\N
682	266	WB Курск FBS	2026-04-02 00:00:00	-	\N	0	1. 0.1 x0.33 = 660₽ | Итого: 660₽	done	2026-04-02 12:42:48.719	2026-04-02 16:09:09.923	0.33	boxes	1	\N	t	1	\N
661	281	WB Курск FBS	2026-04-02 00:00:00	-	\N	0	1. 0.1 x0.15 = 300₽ | Итого: 300₽	done	2026-04-02 07:19:17.867	2026-04-02 16:13:38.528	0.15	boxes	1	\N	t	1	\N
688	281	WB Курск FBS	2026-04-03 00:00:00	-	\N	1	\N	done	2026-04-02 16:25:05.031	2026-04-02 16:25:15.865	\N	boxes	1	\N	t	1	\N
689	262	WB Курск FBS	2026-04-03 00:00:00	-	\N	1	\N	done	2026-04-02 16:30:18.273	2026-04-02 16:30:24.105	\N	boxes	1	\N	t	1	\N
679	346	WB Коледино	2026-04-05 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-04-02 12:19:06.375	2026-04-03 12:06:45.956	\N	boxes	12	83	t	2	2026-04-06 00:00:00
655	384	WB Рязань	2026-04-04 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-04-01 17:30:13.813	2026-04-03 12:12:25.039	\N	boxes	14	83	t	2	2026-04-04 00:00:00
664	439	WB Рязань	2026-04-04 00:00:00	-	\N	11	1. Средняя x11 = 9350₽ | Услуги клиента: Помощь на выгрузке x11, Забор груза с адреса | Итого: 10810₽	shipped	2026-04-02 09:18:13.276	2026-04-03 12:12:37.943	\N	boxes	14	2	t	2	2026-04-03 00:00:00
671	285	WB Тула (Алексин)	2026-04-03 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-02 10:30:55.625	2026-04-03 12:15:44.78	\N	boxes	1	3	t	2	2026-04-03 00:00:00
686	785	WB Рязань	2026-04-04 00:00:00	-	\N	4	1. Маленькая x4 = 3000₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x4 | Итого: 4390₽	archived	2026-04-02 15:04:01.39	2026-04-03 12:14:13.933	\N	boxes	14	1	t	2	2026-04-03 00:00:00
681	493	WB Коледино	2026-04-08 00:00:00	-	\N	1	1. Маленькая x1 = 750₽ | Итого: 750₽	shipped	2026-04-02 12:36:49.945	2026-04-09 10:29:59.412	\N	boxes	12	1	t	2	2026-04-09 00:00:00
663	760	WB Коледино	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 950₽ | Итого: 950₽	archived	2026-04-02 08:33:46.128	2026-04-03 12:21:20.246	\N	boxes	12	3	t	2	2026-04-05 00:00:00
683	558	WB Коледино	2026-04-05 00:00:00	-	\N	1	1. Маленькая x1 = 750₽ | Итого: 750₽	shipped	2026-04-02 13:04:45.623	2026-04-03 12:22:01.29	\N	boxes	12	1	t	2	2026-04-05 00:00:00
685	528	WB Коледино	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 950₽ | Итого: 950₽	shipped	2026-04-02 14:50:54.237	2026-04-03 12:22:16.977	\N	boxes	12	3	t	2	2026-04-05 00:00:00
684	528	WB Электросталь	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-02 14:50:16.978	2026-04-03 12:23:57.077	\N	boxes	17	3	t	2	2026-04-05 00:00:00
662	655	WB Электросталь	2026-04-05 00:00:00	-	\N	5	1. Большая x5 = 4950₽ | Итого: 4950₽	shipped	2026-04-02 07:34:13.975	2026-04-03 12:25:22.69	\N	boxes	17	3	t	2	2026-04-02 00:00:00
677	512	WB Электросталь	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-02 12:08:04.909	2026-04-03 12:26:57.374	\N	boxes	17	3	t	2	2026-04-03 00:00:00
653	255	WB Курск FBS	2026-04-02 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-01 16:32:46.01	2026-04-03 12:41:42.88	2	boxes	1	\N	t	1	\N
692	223	WB Воронеж	2026-04-22 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4250₽ | Итого: 4250₽	archived	2026-04-02 16:57:53.557	2026-04-02 16:59:16.158	\N	boxes	7	83	t	2	2026-05-09 00:00:00
691	223	WB Курск FBS	2026-04-04 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-02 16:57:44.591	2026-04-02 16:59:25.375	2	boxes	1	\N	t	1	\N
701	257	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 09:11:46.739	2026-04-06 09:11:21.476	0.1	boxes	1	\N	t	1	\N
717	375	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-04 09:49:07.17	2026-04-06 09:13:06.729	0.1	boxes	1	\N	t	1	\N
696	793	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	-	\N	15	1. Большая x15 = 15600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x15 | Итого: 17100₽	shipped	2026-04-03 06:56:17.069	2026-04-09 10:53:08.964	\N	boxes	21	3	t	2	2026-04-09 00:00:00
722	266	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.41 = 820₽ | Итого: 820₽	done	2026-04-04 12:33:59.62	2026-04-06 09:09:12.814	0.41	boxes	1	\N	t	1	\N
697	426	WB Электросталь	2026-04-05 00:00:00	-	\N	2	1. Средняя x2 = 1780₽ | Итого: 1780₽	shipped	2026-04-03 07:37:10.902	2026-04-03 12:23:29.501	\N	boxes	17	2	t	2	2026-04-05 00:00:00
678	512	WB Краснодар	2026-04-10 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-02 12:08:41.559	2026-04-03 12:02:58.153	\N	boxes	8	3	t	2	2026-04-03 00:00:00
694	503	WB Рязань	2026-04-11 00:00:00	-	\N	1	1. Маленькая x1 = 750₽ | Итого: 750₽	shipped	2026-04-02 20:52:53.553	2026-04-10 12:57:20.943	\N	boxes	14	1	t	2	2026-04-11 00:00:00
712	807	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	-	\N	1	1. Большая x1 = 1200₽ | Итого: 1200₽	shipped	2026-04-03 17:52:29.522	2026-04-10 08:20:13.817	\N	boxes	13	3	t	2	2026-04-13 00:00:00
698	426	WB Тула (Алексин)	2026-04-05 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-04-03 07:38:04.84	2026-04-03 12:16:46.43	\N	boxes	1	2	t	2	2026-04-05 00:00:00
708	192	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 12:22:22.19	2026-04-03 12:26:10.285	0.1	boxes	1	\N	t	1	\N
705	265	WB Тула (Алексин)	2026-04-05 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-03 11:16:26.414	2026-04-03 12:17:46.2	\N	boxes	1	3	t	2	2026-04-05 00:00:00
704	265	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 10:09:07.981	2026-04-06 09:10:20.719	0.1	boxes	1	\N	t	1	\N
709	266	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.4 = 800₽ | Итого: 800₽	done	2026-04-03 12:30:18.933	2026-04-06 09:08:38.338	0.4	boxes	1	\N	t	1	\N
720	223	WB Волгоград	2026-05-10 00:00:00	-	0.3	1	\N	archived	2026-04-04 11:07:07.851	2026-04-04 11:07:34.363	\N	pallets	9	\N	t	2	\N
719	223	WB Курск FBS	2026-04-04 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-04 10:22:14.377	2026-04-04 11:07:38.585	2	boxes	1	\N	t	1	\N
718	223	WB Курск FBS	2026-04-06 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-04 10:22:08.891	2026-04-04 11:09:40.824	2	boxes	1	\N	t	1	\N
729	411	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	-	\N	2	1. Маленькая x1 = 840₽; 2. Большая x1 = 1040₽ | Итого: 1880₽	shipped	2026-04-06 04:29:48.983	2026-04-09 10:52:06.814	\N	boxes	21	1	t	2	2026-04-10 00:00:00
723	266	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	-	\N	1	\N	shipped	2026-04-04 12:35:37.835	2026-04-09 11:42:50.235	\N	boxes	21	3	t	2	2026-04-10 00:00:00
724	724	WB Курск FBS	2026-04-04 00:00:00	-	\N	1	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-04 12:46:13.839	2026-04-04 13:16:57.887	0.1	boxes	1	\N	f	1	\N
715	281	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-04 08:35:27.195	2026-04-06 09:19:48.047	0.1	boxes	1	\N	t	1	\N
707	260	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 12:21:27.898	2026-04-06 09:09:52.278	0.1	boxes	1	\N	t	1	\N
721	263	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.45 = 900₽ | Итого: 900₽	done	2026-04-04 12:04:09.071	2026-04-06 09:28:45.298	0.45	boxes	1	\N	t	1	\N
728	459	WB Котовск	2026-04-08 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-04-05 22:26:03.884	2026-04-10 08:48:01.602	\N	boxes	15	3	t	2	2026-04-08 00:00:00
714	262	WB Курск FBS	2026-04-04 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-04 06:15:38.728	2026-04-06 09:21:17.665	0.1	boxes	1	\N	t	1	\N
699	281	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	archived	2026-04-03 08:37:45.598	2026-04-06 09:18:42.658	0.1	boxes	1	\N	t	1	\N
700	375	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 09:03:13.945	2026-04-06 09:12:55.102	0.1	boxes	1	\N	t	1	\N
710	342	WB Курск FBS	2026-04-03 00:00:00	-	\N	0	1. 0.1 x0.08 = 160₽ | Итого: 160₽	done	2026-04-03 13:05:22.768	2026-04-06 09:07:51.468	0.1	boxes	1	\N	t	1	\N
716	258	WB Курск FBS	2026-04-04 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-04 09:15:06.451	2026-04-06 10:03:07.38	0.1	boxes	1	\N	t	1	\N
703	298	WB Волгоград	2026-04-10 00:00:00	-	\N	4	1. Большая x4 = 3960₽ | Услуги клиента: Забор груза с адреса | Итого: 5310₽	shipped	2026-04-03 09:27:15.25	2026-04-09 11:00:52.682	\N	boxes	9	3	t	2	2026-04-10 00:00:00
727	430	WB Новосемейкино	2026-04-09 00:00:00	-	\N	26	1. Большая x26 = 27040₽ | Услуги клиента: Помощь на выгрузке x26 | Итого: 27300₽	shipped	2026-04-05 15:02:41.696	2026-04-10 08:57:42.045	\N	boxes	16	3	t	2	2026-04-10 00:00:00
711	807	WB Тула (Алексин)	2026-04-08 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-03 13:10:47.402	2026-04-09 10:23:31.692	\N	boxes	1	3	t	2	2026-04-08 00:00:00
725	255	WB Коледино	2026-04-08 00:00:00	-	\N	5	1. от 0 кг до 300 кг x5 = 31500₽ | Услуги клиента: Забор груза с адреса | Итого: 32850₽	done	2026-04-04 13:12:27.524	2026-04-08 08:52:09.979	\N	pallets	12	\N	t	2	2026-04-08 00:00:00
726	427	WB Подольск	2026-04-08 00:00:00	-	\N	1	1. Маленькая x1 = 750₽ | Итого: 750₽	shipped	2026-04-05 08:24:08.36	2026-04-09 10:32:05.237	\N	boxes	3	1	t	2	2026-04-08 00:00:00
702	384	WB Котовск	2026-04-08 00:00:00	-	\N	4	1. Большая x4 = 3600₽ | Итого: 3600₽	shipped	2026-04-03 09:26:54.081	2026-04-10 08:49:35.458	\N	boxes	15	3	t	2	2026-04-08 00:00:00
706	346	WB Новосемейкино	2026-04-09 00:00:00	-	\N	4	1. Большая x4 = 4160₽ | Итого: 4160₽	shipped	2026-04-03 11:46:49.339	2026-04-10 08:59:33.449	\N	boxes	16	3	t	2	2026-04-09 00:00:00
693	503	WB Новосемейкино	2026-04-09 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-04-02 20:51:44.27	2026-04-10 09:01:00.569	\N	boxes	16	3	t	2	2026-04-09 00:00:00
765	266	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.86 = 1720₽ | Итого: 1 720₽	done	2026-04-06 12:39:30.745	2026-04-09 09:40:22.61	0.86	boxes	1	\N	t	1	\N
695	262	WB Курск FBS	2026-04-03 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-03 06:25:09.088	2026-04-06 09:20:48.042	0.1	boxes	1	\N	t	1	\N
713	255	WB Курск FBS	2026-04-04 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 4 700₽	done	2026-04-04 05:15:20.554	2026-04-06 09:22:18.69	2	boxes	1	\N	t	1	\N
736	725	WB Новосемейкино	2026-04-09 00:00:00	-	\N	3	1. Маленькая x3 = 2520₽ | Итого: 2520₽	shipped	2026-04-06 06:11:32.583	2026-04-06 06:56:58.98	\N	boxes	16	1	t	2	2026-04-09 00:00:00
739	397	WB Электросталь	2026-04-12 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5000₽ | Итого: 5000₽	shipped	2026-04-06 06:41:44.473	2026-04-10 13:03:34.77	\N	boxes	17	83	t	2	2026-04-12 00:00:00
745	845	WB Невинномысск	2026-04-09 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-04-06 07:26:07.469	2026-04-06 07:41:00.033	\N	boxes	10	1	t	2	2026-04-09 00:00:00
731	751	WB Котовск	2026-04-08 00:00:00	-	\N	1	1. Маленькая x1 = 700₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 710₽	shipped	2026-04-06 05:51:26.539	2026-04-10 08:47:07.27	\N	boxes	15	3	t	2	2026-04-08 00:00:00
761	518	WB Курск	2026-04-08 00:00:00	-	\N	10	1. от 5 до 10 коробок x10 = 43000₽ | Итого: 43000₽	shipped	2026-04-06 10:28:29.004	2026-04-09 10:19:16.85	\N	boxes	2	83	t	2	2026-04-08 00:00:00
742	670	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 14000₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 14010₽	warehouse	2026-04-06 06:54:46.569	2026-04-06 09:18:12.747	\N	pallets	13	\N	t	2	2026-04-13 00:00:00
753	316	WB Курск FBS	2026-04-04 00:00:00	-	\N	1	\N	done	2026-04-06 09:30:18.074	2026-04-06 09:30:45.127	\N	boxes	1	\N	t	1	\N
754	292	WB Курск FBS	2026-04-06 00:00:00	-	\N	1	\N	done	2026-04-06 09:48:45.225	2026-04-06 09:49:11.139	\N	boxes	1	\N	t	1	\N
758	347	WB Курск FBS	2026-04-04 00:00:00	-	\N	1	\N	done	2026-04-06 10:05:31.017	2026-04-06 10:06:31.393	\N	boxes	1	\N	t	1	\N
759	202	WB Курск FBS	2026-04-03 00:00:00	-	\N	1	\N	done	2026-04-06 10:08:05.105	2026-04-06 10:08:08.38	\N	boxes	1	\N	t	1	\N
760	674	WB Курск FBS	2026-04-03 00:00:00	-	\N	1	\N	done	2026-04-06 10:09:10.345	2026-04-06 10:09:16.288	\N	boxes	1	\N	t	1	\N
764	436	WB Электросталь	2026-04-08 00:00:00	-	\N	1	1. Маленькая x2 = 1580₽ | Итого: 1580₽	shipped	2026-04-06 11:35:34.02	2026-04-09 10:28:11.477	\N	boxes	17	3	t	2	2026-04-09 00:00:00
747	273	WB Новосемейкино	2026-04-09 00:00:00	-	\N	6	1. от 5 до 10 коробок x1 = 5500₽ | Итого: 5500₽	shipped	2026-04-06 07:49:49.825	2026-04-10 08:53:38.492	\N	boxes	16	83	t	2	2026-04-09 00:00:00
756	342	WB Котовск	2026-04-08 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 7400₽ | Услуги клиента: Забор груза с адреса | Итого: 8750₽	shipped	2026-04-06 10:01:38.738	2026-04-10 08:42:20.395	\N	pallets	15	\N	t	2	2026-04-08 00:00:00
743	723	WB Новосемейкино	2026-04-09 00:00:00	-	\N	6	1. Большая x6 = 6240₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x6 | Итого: 7650₽	shipped	2026-04-06 07:12:50.049	2026-04-10 08:54:26.935	\N	boxes	16	3	t	2	2026-04-09 00:00:00
730	285	WB Новосемейкино	2026-04-09 00:00:00	-	\N	4	1. Большая x4 = 4160₽ | Итого: 4160₽	shipped	2026-04-06 05:47:37.025	2026-04-10 08:56:57.282	\N	boxes	16	3	t	2	2026-04-09 00:00:00
748	273	WB Воронеж	2026-04-08 00:00:00	-	\N	1	1. Большая x1 = 850₽ | Итого: 850₽	shipped	2026-04-06 07:50:12.674	2026-04-10 08:22:56.933	\N	boxes	7	3	t	2	2026-04-08 00:00:00
757	342	WB Невинномысск	2026-04-09 00:00:00	-	\N	1	1. от 401 кг до 500 кг x1 = 9900₽ | Итого: 9900₽	shipped	2026-04-06 10:02:14.273	2026-04-10 08:36:06.462	\N	pallets	10	\N	t	2	2026-04-09 00:00:00
733	751	WB Невинномысск	2026-04-09 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 900₽	shipped	2026-04-06 05:52:32.703	2026-04-10 08:39:40.167	\N	boxes	10	3	t	2	2026-04-09 00:00:00
755	674	WB Котовск	2026-04-08 00:00:00	-	\N	6	1. Маленькая x6 = 4200₽ | Итого: 4200₽	shipped	2026-04-06 09:58:18.253	2026-04-10 08:44:39.617	\N	boxes	15	2	t	2	2026-04-08 00:00:00
763	436	WB Тула (Алексин)	2026-04-08 00:00:00	-	\N	2	1. Маленькая x2 = 1400₽ | Итого: 1400₽	shipped	2026-04-06 11:35:07.48	2026-04-09 10:23:18.836	\N	boxes	1	1	t	2	2026-04-09 00:00:00
746	346	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 7500₽ | Итого: 7500₽	shipped	2026-04-06 07:45:55.992	2026-04-10 09:04:52.441	\N	boxes	13	83	t	2	2026-04-13 00:00:00
735	260	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-06 05:58:03.564	2026-04-06 13:05:07.941	0.1	boxes	1	\N	t	1	\N
749	281	WB Курск FBS	2026-04-06 00:00:00	-	\N	2	1. 0.1 x0.15 = 300₽ | Итого: 300₽	done	2026-04-06 08:02:36.038	2026-04-09 13:55:08.028	1	boxes	1	\N	t	1	\N
750	724	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-06 08:29:59.205	2026-04-07 07:32:33.314	0.1	boxes	1	\N	t	1	\N
744	471	WB Краснодар	2026-04-10 00:00:00	-	\N	1	1. Большая x1 = 990₽ | Итого: 990₽	shipped	2026-04-06 07:14:54.778	2026-04-10 08:23:57.811	\N	boxes	8	3	t	2	2026-04-10 00:00:00
734	751	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	-	\N	1	1. Средняя x1 = 1100₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 1110₽	shipped	2026-04-06 05:53:52.907	2026-04-10 08:19:18.886	\N	boxes	13	2	t	2	2026-04-13 00:00:00
741	262	WB Курск FBS	2026-04-06 00:00:00	-	\N	2	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-06 06:48:57.59	2026-04-09 09:36:54.671	0.1	boxes	1	\N	t	1	\N
752	375	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	done	2026-04-06 09:13:55.061	2026-04-09 09:38:49.971	0.2	boxes	1	\N	t	1	\N
751	855	WB Коледино	2026-04-08 00:00:00	-	\N	1	1. Большая x1 = 950₽ | Итого: 950₽	shipped	2026-04-06 08:43:01.993	2026-04-09 10:29:21.731	\N	boxes	12	3	t	2	2026-04-08 00:00:00
762	436	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-04-06 11:34:41.125	2026-04-09 10:51:45.326	\N	boxes	21	1	t	2	2026-04-11 00:00:00
732	751	WB Новосемейкино	2026-04-09 00:00:00	-	\N	1	1. Средняя x1 = 940₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 950₽	shipped	2026-04-06 05:52:03.129	2026-04-10 08:56:20.418	\N	boxes	16	3	t	2	2026-04-09 00:00:00
738	397	WB Тула (Алексин)	2026-04-15 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4500₽ | Итого: 4500₽	new	2026-04-06 06:39:50.441	2026-04-10 12:49:21.511	\N	boxes	1	83	t	2	2026-04-15 00:00:00
740	397	WB Коледино	2026-04-15 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	new	2026-04-06 06:42:06.491	2026-04-10 13:05:14.19	\N	boxes	12	83	t	2	2025-04-15 00:00:00
785	281	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-07 07:31:01.869	2026-04-09 13:55:15.802	0.1	boxes	1	\N	t	1	\N
803	262	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-08 07:07:26.036	2026-04-09 09:35:26.29	0.1	boxes	1	\N	t	1	\N
770	512	WB Тула (Алексин)	2026-04-08 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-06 13:59:41.688	2026-04-09 10:23:02.446	\N	boxes	1	3	t	2	2026-04-08 00:00:00
766	266	WB Екатеринбург (Перспективная 14)	2026-04-13 00:00:00	-	\N	6	1. Большая x6 = 7200₽ | Итого: 7200₽	shipped	2026-04-06 12:40:47.853	2026-04-10 08:17:47.095	\N	boxes	13	3	t	2	2026-04-13 00:00:00
780	223	WB Курск FBS	2026-04-06 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-06 19:53:32.772	2026-04-08 11:59:27.235	1	boxes	1	\N	t	1	\N
781	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-04-06 20:45:26.077	2026-04-08 11:59:23.976	0.1	boxes	1	\N	t	1	\N
772	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-04-06 16:06:25.384	2026-04-08 11:58:57.497	3	boxes	1	\N	t	1	\N
799	254	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	5	1. Средняя x1 = 800₽; 2. Большая x4 = 3600₽ | Итого: 4400₽	shipped	2026-04-07 14:20:53.811	2026-04-10 12:46:49.536	\N	boxes	1	2	t	2	2026-04-12 00:00:00
783	255	WB Курск FBS	2026-04-07 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-07 06:36:07.262	2026-04-10 09:11:51.053	2	boxes	1	\N	t	1	\N
777	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-06 19:23:41.185	2026-04-08 11:59:33.974	1	boxes	1	\N	t	1	\N
778	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-04-06 19:26:13.691	2026-04-08 11:59:31.845	2	boxes	1	\N	t	1	\N
774	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	2	1. 0.1 x1 = 2000₽ | Итого: 2 000₽	archived	2026-04-06 18:37:52.962	2026-04-08 11:59:37.091	1	boxes	1	\N	t	1	\N
787	291	WB Тула (Алексин)	2026-04-08 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-04-07 07:50:40.316	2026-04-09 10:22:53.556	\N	boxes	1	2	t	2	2026-04-08 00:00:00
798	254	WB Рязань	2026-04-11 00:00:00	-	\N	5	1. Средняя x3 = 2550₽; 2. Большая x2 = 1900₽ | Итого: 4450₽	shipped	2026-04-07 14:19:33.914	2026-04-10 12:56:48.508	\N	boxes	14	2	t	2	2026-04-11 00:00:00
775	518	WB Сарапул	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 1100₽ | Итого: 1100₽	shipped	2026-04-06 18:51:20.034	2026-04-09 10:50:37.779	\N	boxes	4	3	t	2	2026-04-12 00:00:00
793	297	WB Электросталь	2026-04-08 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-04-07 10:28:10.386	2026-04-09 10:26:25.367	\N	boxes	17	2	t	2	2026-04-08 00:00:00
768	192	WB Курск FBS	2026-04-06 00:00:00	-	\N	15	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-06 12:48:19.182	2026-04-09 06:11:27.362	0.15	boxes	1	\N	f	1	\N
792	263	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.225 = 450₽ | Итого: 450₽	done	2026-04-07 09:44:57.028	2026-04-09 09:23:26.927	0.225	boxes	1	\N	t	1	\N
779	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Итого: 4 000₽	archived	2026-04-06 19:48:56.17	2026-04-08 11:59:29.574	12	boxes	1	\N	t	1	\N
794	297	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.05 = 100₽ | Итого: 100₽	done	2026-04-07 10:28:47.669	2026-04-09 09:19:07.36	0.1	boxes	1	\N	t	1	\N
795	257	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-07 11:19:00.682	2026-04-09 09:16:17.585	0.1	boxes	1	\N	t	1	\N
737	255	WB Курск FBS	2026-04-06 00:00:00	-	\N	4	1. 0.1 x4 = 8000₽ | Услуги клиента: Забор груза с адреса | Итого: 8 500₽	done	2026-04-06 06:30:24.948	2026-04-10 09:22:14.909	4	boxes	1	\N	t	1	\N
773	223	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Итого: 1 000₽	archived	2026-04-06 18:24:41.099	2026-04-08 11:59:39.541	0.5	boxes	1	\N	t	1	\N
784	621	WB Электросталь	2026-04-08 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 13600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x2 | Итого: 14970₽	shipped	2026-04-07 06:40:07.078	2026-04-09 10:27:43.277	\N	pallets	17	\N	t	2	2026-04-08 00:00:00
800	760	WB Воронеж	2026-04-08 00:00:00	-	\N	1	1. Большая x1 = 850₽ | Итого: 850₽	shipped	2026-04-07 16:15:21.34	2026-04-10 08:22:35.313	\N	boxes	7	3	t	2	2026-04-08 00:00:00
796	266	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.52 = 1040₽ | Итого: 1 040₽	done	2026-04-07 12:04:28.034	2026-04-09 08:39:35.607	0.52	boxes	1	\N	t	1	\N
767	265	WB Курск FBS	2026-04-06 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-06 12:45:48.498	2026-04-09 09:33:52.83	0.1	boxes	1	\N	t	1	\N
797	265	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-07 13:18:15.405	2026-04-09 09:33:35.315	0.1	boxes	1	\N	t	1	\N
782	262	WB Курск FBS	2026-04-07 00:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-07 06:16:20.091	2026-04-09 09:35:42.296	0.1	boxes	1	\N	t	1	\N
790	793	WB Коледино	2026-04-08 00:00:00	-	\N	3	1. Большая x3 = 2850₽ | Итого: 2850₽	shipped	2026-04-07 08:56:29.997	2026-04-09 10:29:10.508	\N	boxes	12	3	t	2	2026-04-08 00:00:00
786	291	WB Волгоград	2026-04-10 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-04-07 07:49:39.416	2026-04-09 11:01:08.77	\N	boxes	9	1	t	2	2026-04-10 00:00:00
804	281	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-08 07:08:00.123	2026-04-09 13:55:20.862	0.1	boxes	1	\N	t	1	\N
802	785	WB Невинномысск	2026-04-09 00:00:00	-	\N	2	1. Маленькая x2 = 1580₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x2 | Итого: 2950₽	shipped	2026-04-08 06:36:13.739	2026-04-10 08:34:13.76	\N	boxes	10	1	t	2	2026-04-08 00:00:00
771	291	WB Котовск	2026-04-08 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-04-06 14:12:08.402	2026-04-10 08:41:47.196	\N	boxes	15	2	t	2	2026-04-08 00:00:00
769	512	WB Новосемейкино	2026-04-09 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Итого: 1040₽	shipped	2026-04-06 13:58:47.413	2026-04-10 08:52:55.471	\N	boxes	16	3	t	2	2026-04-09 00:00:00
801	255	WB Курск FBS	2026-04-08 12:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-08 06:22:23.498	2026-04-10 09:10:30.544	2	boxes	1	\N	t	1	\N
789	214	WB Тула (Алексин)	2026-04-10 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-04-07 08:49:20.273	2026-04-10 12:48:10.803	\N	boxes	1	3	t	2	2026-04-10 00:00:00
788	214	WB Электросталь	2026-04-12 00:00:00	-	\N	4	1. Большая x3 = 2970₽ | Итого: 2970₽	shipped	2026-04-07 08:48:37.493	2026-04-10 13:02:24.144	\N	boxes	17	3	t	2	2026-04-12 00:00:00
805	192	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-08 08:27:56.606	2026-04-08 08:55:46.731	0.1	boxes	1	\N	t	1	\N
807	198	WB Воронеж	2026-04-15 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 5000₽ | Услуги клиента: Забор груза с адреса | Итого: 6350₽	new	2026-04-08 08:59:36.888	2026-04-08 08:59:36.888	\N	pallets	7	\N	f	2	2026-04-14 00:00:00
842	192	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.01 = 20₽ | Итого: 20₽	done	2026-04-08 10:23:36.835	2026-04-08 10:24:52.984	0.01	boxes	1	\N	t	1	\N
849	202	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-08 12:05:14.708	2026-04-09 09:29:43.359	0.1	boxes	1	\N	t	1	\N
843	265	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-08 11:25:59.437	2026-04-09 09:33:08.6	0.1	boxes	1	\N	t	1	\N
806	273	WB Рязань	2026-04-11 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4750₽ | Итого: 4750₽	shipped	2026-04-08 08:33:08.935	2026-04-08 11:12:28.582	\N	boxes	14	83	t	2	2026-04-11 00:00:00
809	223	WB Курск FBS	2026-04-11 12:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-04-08 10:10:01.906	2026-04-08 11:33:28.963	3	boxes	1	\N	t	1	\N
860	315	WB Рязань	2026-04-11 00:00:00	-	\N	2	1. Большая x2 = 1900₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 1920₽	shipped	2026-04-09 08:04:17.099	2026-04-09 08:05:15.749	\N	boxes	14	3	t	2	2026-04-11 00:00:00
847	192	WB Курск FBS	2026-03-21 00:00:00	-	\N	1	\N	done	2026-04-08 11:42:22.557	2026-04-08 11:42:29.643	0.1	boxes	1	\N	t	1	\N
848	223	WB Курск	2026-04-24 00:00:00	-	\N	1	\N	archived	2026-04-08 11:58:22.893	2026-04-08 11:59:06.592	\N	pallets	2	\N	t	2	\N
845	223	WB Курск	2026-04-24 00:00:00	-	\N	1	\N	archived	2026-04-08 11:39:03.472	2026-04-08 11:59:09.921	\N	pallets	2	\N	t	2	\N
844	223	WB Курск FBS	2026-04-10 12:00:00	-	\N	3	1. 0.1 x3 = 6000₽ | Итого: 6 000₽	archived	2026-04-08 11:33:37.521	2026-04-08 11:59:12.872	3	boxes	1	\N	t	1	\N
846	223	WB Курск FBS	2026-04-08 12:00:00	-	\N	1	\N	archived	2026-04-08 11:39:14.037	2026-04-08 11:59:15.314	0.1	boxes	1	\N	t	1	\N
853	192	WB Курск FBS	2026-04-08 12:00:00	-	\N	1	\N	done	2026-04-08 12:47:43.474	2026-04-08 12:47:52.799	0.1	boxes	1	\N	t	1	\N
852	223	WB Краснодар	2026-05-02 00:00:00	-	\N	1	\N	archived	2026-04-08 12:20:53.481	2026-04-08 14:03:13.795	\N	pallets	8	\N	t	2	\N
851	223	WB Курск	2026-04-18 00:00:00	-	\N	1	\N	archived	2026-04-08 12:18:29.702	2026-04-08 14:03:16.93	\N	pallets	2	\N	t	2	\N
850	223	WB Курск	2026-04-08 00:00:00	-	\N	1	\N	archived	2026-04-08 12:17:28.68	2026-04-08 14:03:19.969	\N	boxes	2	2	t	2	\N
862	315	WB Екатеринбург (Перспективная 14)	2026-04-20 00:00:00	-	\N	3	1. Большая x3 = 3600₽ | Услуги клиента: Помощь на выгрузке x3 | Итого: 3630₽	new	2026-04-09 08:18:05.748	2026-04-09 08:18:05.748	\N	boxes	13	3	f	2	2026-04-20 00:00:00
866	266	WB Курск FBS	2026-04-08 12:00:00	-	\N	1	\N	done	2026-04-09 08:41:40.326	2026-04-09 08:41:49.923	0.5	boxes	1	\N	t	1	\N
867	266	WB Курск FBS	2026-04-06 00:00:00	-	\N	1	\N	done	2026-04-09 08:42:54.371	2026-04-09 08:43:01.17	0.86	boxes	1	\N	t	1	\N
868	347	WB Курск FBS	2026-04-08 12:00:00	-	\N	1	\N	done	2026-04-09 08:45:09.008	2026-04-09 08:45:15.71	1.75	boxes	1	\N	t	1	\N
808	375	WB Курск FBS	2026-04-08 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽; 2. 0.1 x0.1 = 200₽ | Итого: 400₽	done	2026-04-08 09:25:36.6	2026-04-09 09:37:43.844	0.2	boxes	1	\N	t	1	\N
869	292	WB Курск FBS	2026-04-08 00:00:00	-	\N	1	\N	done	2026-04-09 09:26:09.524	2026-04-09 09:26:31.091	4.05	boxes	1	\N	t	1	\N
791	793	WB Тула (Алексин)	2026-04-08 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 5300₽; 2. Большая x7 = 6300₽ | Услуги клиента: Помощь на выгрузке x8 | Итого: 11680₽	shipped	2026-04-07 09:10:33.333	2026-04-09 10:21:06.722	\N	pallets	1	\N	t	2	2026-04-08 00:00:00
857	223	WB Воронеж	2026-04-15 00:00:00		\N	5	\N	archived	2026-04-08 14:35:51.937	2026-04-10 16:36:11.804	\N	boxes	7	2	t	2	\N
776	518	WB Санкт-Петербург ( п. Шушары, Московское шоссе, 153к2)	2026-04-10 00:00:00	-	\N	1	1. Маленькая x1 = 840₽ | Итого: 840₽	shipped	2026-04-06 18:54:51.346	2026-04-09 10:51:19.192	\N	boxes	21	1	t	2	2026-04-10 00:00:00
856	223	WB Курск FBS	2026-04-11 12:00:00		\N	1	\N	archived	2026-04-08 14:32:41.188	2026-04-10 16:36:16.099	1	boxes	34	\N	t	1	\N
871	255	WB Курск FBS	2026-04-10 12:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	new	2026-04-09 09:38:15.499	2026-04-10 09:25:55.63	2	boxes	1	\N	t	1	\N
873	375	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-09 09:47:05.229	2026-04-09 13:08:15.854	0.1	boxes	1	\N	t	1	\N
877	202	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	1. 0.1 x1 = 2000₽; 2. 0.1 x0.1 = 200₽ | Итого: 2 200₽	done	2026-04-09 11:11:48.901	2026-04-09 13:42:12.292	1.1	boxes	1	\N	t	1	\N
861	281	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-09 08:12:43.052	2026-04-09 13:55:54.581	0.1	boxes	1	\N	t	1	\N
859	198	WB Новосемейкино	2026-04-23 00:00:00	-	\N	1	1. от 0 кг до 300 кг x1 = 8300₽ | Услуги клиента: Забор груза с адреса | Итого: 9650₽	new	2026-04-09 06:18:08.198	2026-04-10 08:52:34.343	\N	pallets	16	\N	t	2	2026-04-23 00:00:00
870	255	WB Курск FBS	2026-04-09 12:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	done	2026-04-09 09:38:00.43	2026-04-10 09:03:02.788	2	boxes	1	\N	t	1	\N
874	192	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-09 10:19:50.012	2026-04-10 08:55:09.596	0.1	boxes	1	\N	t	1	\N
872	255	WB Курск FBS	2026-04-11 12:00:00	-	\N	2	1. 0.1 x2 = 4000₽ | Услуги клиента: Забор груза с адреса | Итого: 4 500₽	new	2026-04-09 09:38:28.475	2026-04-10 09:27:32.524	2	boxes	1	\N	t	1	\N
875	700	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-09 10:47:23.723	2026-04-10 12:45:08.799	\N	boxes	1	3	t	2	2026-04-12 00:00:00
863	426	WB Рязань	2026-04-11 00:00:00	-	\N	1	1. Средняя x1 = 850₽ | Итого: 850₽	shipped	2026-04-09 08:23:35.224	2026-04-10 12:54:32.925	\N	boxes	14	2	t	2	2026-04-11 00:00:00
855	950	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	done	2026-04-08 14:14:35.292	2026-04-10 12:45:36.794	\N	boxes	1	3	t	2	2026-04-11 00:00:00
858	952	WB Рязань	2026-04-11 00:00:00	-	\N	1	1. Большая x1 = 950₽ | Итого: 950₽	shipped	2026-04-08 18:02:01.535	2026-04-10 12:55:26.442	\N	boxes	14	3	t	2	2026-04-11 00:00:00
854	297	WB Рязань	2026-04-11 00:00:00	-	\N	1	1. Средняя x1 = 0₽ | Итого: 0₽	shipped	2026-04-08 12:56:52.393	2026-04-10 12:56:08.689	\N	boxes	14	2	t	2	2026-04-11 00:00:00
876	493	WB Электросталь	2026-04-12 00:00:00	-	\N	1	1. Маленькая x1 = 790₽ | Итого: 790₽	shipped	2026-04-09 11:06:47.971	2026-04-10 12:59:57.882	\N	boxes	17	1	t	2	2026-04-12 00:00:00
865	257	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	warehouse	2026-04-09 08:29:56.565	2026-04-09 11:17:20.873	0.1	boxes	1	\N	t	1	\N
899	621	WB Невинномысск	2026-04-17 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 0₽ | Итого: 0₽	new	2026-04-10 08:45:12.51	2026-04-10 08:45:12.51	\N	pallets	10	\N	f	2	2026-04-13 00:00:00
892	281	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-10 07:00:29.522	2026-04-11 13:53:04.261	0.1	boxes	1	\N	t	1	\N
898	192	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	done	2026-04-10 08:41:06.179	2026-04-10 08:48:08.503	0.1	boxes	1	\N	t	1	\N
881	316	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	\N	warehouse	2026-04-09 12:48:03.289	2026-04-09 12:48:12.78	0.144	boxes	1	\N	t	1	\N
882	316	WB Курск FBS	2026-04-07 00:00:00	-	\N	1	\N	done	2026-04-09 12:59:33.186	2026-04-09 12:59:39.69	0.1	boxes	1	\N	t	1	\N
883	303	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	\N	warehouse	2026-04-09 13:02:17.951	2026-04-09 13:02:35.981	0.141	boxes	1	\N	t	1	\N
878	263	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.325 = 650₽ | Итого: 650₽	warehouse	2026-04-09 11:47:47.945	2026-04-09 13:03:20.263	0.325	boxes	1	\N	t	1	\N
886	192	WB Курск FBS	2026-04-09 12:00:00		\N	1	\N	done	2026-04-09 13:21:22.029	2026-04-10 08:55:01.501	0.1	boxes	34	\N	t	1	\N
897	793	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	8	1. Большая x8 = 7200₽ | Услуги клиента: Помощь на выгрузке x8, Забор груза с адреса | Итого: 8630₽	shipped	2026-04-10 08:28:26.352	2026-04-10 12:40:58.561	\N	boxes	1	3	t	2	2026-04-12 00:00:00
885	192	WB Курск FBS	2026-04-09 12:00:00		\N	1	\N	done	2026-04-09 13:20:35.562	2026-04-10 08:55:05.334	0.1	boxes	34	\N	t	1	\N
891	439	WB Рязань	2026-04-11 00:00:00	-	\N	8	1. Большая x8 = 7600₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке x8 | Итого: 9030₽	shipped	2026-04-09 15:00:41.125	2026-04-10 12:52:18.952	\N	boxes	14	3	t	2	2026-04-10 00:00:00
887	265	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.13 = 260₽ | Итого: 260₽	warehouse	2026-04-09 13:29:22.678	2026-04-09 13:29:58.695	0.13	boxes	1	\N	t	1	\N
880	266	WB Курск FBS	2026-04-09 12:00:00	-	\N	0	1. 0.1 x0.45 = 900₽ | Итого: 900₽	warehouse	2026-04-09 12:16:57.533	2026-04-09 13:30:34.987	0.45	boxes	1	\N	t	1	\N
888	262	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	\N	warehouse	2026-04-09 13:31:45.483	2026-04-09 13:31:51.938	0.1	boxes	1	\N	t	1	\N
889	347	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	\N	warehouse	2026-04-09 13:36:17.332	2026-04-09 13:36:34.962	0.3	boxes	1	\N	t	1	\N
902	613	WB Новосемейкино	2026-04-16 00:00:00	-	\N	1	1. Большая x1 = 1040₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 1050₽	new	2026-04-10 08:59:05.238	2026-04-10 08:59:05.238	\N	boxes	16	3	f	2	2026-04-16 00:00:00
895	535	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	\N	shipped	2026-04-10 07:36:52.145	2026-04-10 07:37:10.649	\N	boxes	1	3	t	2	\N
896	535	WB Котовск	2026-04-15 00:00:00	-	\N	2	\N	new	2026-04-10 07:40:01.477	2026-04-10 07:40:01.477	\N	boxes	15	3	t	2	\N
903	375	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-10 09:14:48.453	2026-04-10 09:14:48.453	0.1	boxes	1	\N	f	1	\N
884	292	WB Курск FBS	2026-04-09 12:00:00	-	\N	1	\N	done	2026-04-09 13:07:30.141	2026-04-10 09:47:56.884	1.35	boxes	1	\N	t	1	\N
894	426	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Средняя x1 = 800₽ | Итого: 800₽	shipped	2026-04-10 07:35:26.593	2026-04-10 12:42:22.033	\N	boxes	1	2	t	2	2026-04-12 00:00:00
893	426	WB Электросталь	2026-04-12 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	shipped	2026-04-10 07:34:43.539	2026-04-10 12:59:08.516	\N	boxes	17	2	t	2	2026-04-12 00:00:00
901	613	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Услуги клиента: Помощь на выгрузке x1 | Итого: 910₽	done	2026-04-10 08:57:24.36	2026-04-10 12:39:30.359	\N	boxes	1	3	t	2	2026-04-12 00:00:00
890	346	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	3	1. Большая x3 = 2700₽ | Итого: 2700₽	shipped	2026-04-09 14:09:10.55	2026-04-10 12:42:48.046	\N	boxes	1	3	t	2	2026-04-12 00:00:00
900	402	WB Тула (Алексин)	2026-04-12 00:00:00	-	\N	1	1. Большая x1 = 900₽ | Итого: 900₽	shipped	2026-04-10 08:49:33.649	2026-04-10 12:40:01.595	\N	boxes	1	3	t	2	2026-04-12 00:00:00
864	362	WB Электросталь	2026-04-12 00:00:00	-	\N	2	1. от 0 кг до 300 кг x2 = 13600₽ | Услуги клиента: Забор груза с адреса | Итого: 14950₽	shipped	2026-04-09 08:25:52.963	2026-04-10 13:01:06.94	\N	pallets	17	\N	t	2	2026-04-12 00:00:00
908	430	WB Тула (Алексин)	2026-04-12 00:00:00	-	1200	3	\N	shipped	2026-04-10 13:22:43.279	2026-04-10 13:23:26.176	\N	pallets	1	\N	t	2	\N
879	725	WB Электросталь	2026-04-12 00:00:00	-	\N	5	1. Маленькая x5 = 3950₽ | Итого: 3950₽	shipped	2026-04-09 11:57:18.884	2026-04-10 13:04:21.053	\N	boxes	17	1	t	2	2026-04-12 00:00:00
910	188	WB Казань	2026-04-17 00:00:00	-	\N	2	1. от 5 до 10 коробок x2 = 11000₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 11020₽	archived	2026-04-10 17:09:08.654	2026-04-10 17:09:17.739	\N	boxes	5	83	t	2	2026-04-17 00:00:00
909	186	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Услуги клиента: Помощь на выгрузке | Итого: 420₽	archived	2026-04-10 16:08:29.794	2026-04-10 16:35:59.563	0.2	boxes	1	\N	t	1	\N
911	757	WB Электросталь	2026-04-15 00:00:00	-	\N	9	1. от 5 до 10 коробок x9 = 45000₽ | Услуги клиента: Помощь на выгрузке x9 | Итого: 45090₽	new	2026-04-10 20:42:28.122	2026-04-10 20:42:28.122	\N	boxes	17	83	f	2	2026-04-15 00:00:00
913	454	WB Электросталь	2026-04-15 00:00:00	-	\N	5	1. Большая x5 = 4950₽ | Услуги клиента: Помощь на выгрузке x5 | Итого: 5000₽	new	2026-04-10 23:12:39.499	2026-04-10 23:12:39.499	\N	boxes	17	3	f	2	2026-04-16 00:00:00
912	757	WB Электросталь	2026-04-15 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 5000₽ | Итого: 5000₽	new	2026-04-10 20:45:15.238	2026-04-10 20:47:24.662	\N	boxes	17	83	f	2	2026-04-15 00:00:00
914	454	WB Невинномысск	2026-04-16 00:00:00	-	\N	4	1. Большая x3 = 2970₽; 2. Средняя x1 = 890₽ | Услуги клиента: Помощь на выгрузке x4 | Итого: 3900₽	new	2026-04-10 23:14:01.039	2026-04-10 23:14:01.039	\N	boxes	10	3	f	2	2026-04-16 00:00:00
915	454	WB Новосемейкино	2026-04-16 00:00:00	-	\N	2	1. Большая x2 = 2080₽ | Услуги клиента: Помощь на выгрузке x2 | Итого: 2100₽	new	2026-04-10 23:15:03.206	2026-04-10 23:15:03.206	\N	boxes	16	3	f	2	2026-04-16 00:00:00
907	260	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-10 13:21:48.602	2026-04-11 13:17:30.384	0.1	boxes	1	\N	t	1	\N
906	202	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-10 13:14:07.15	2026-04-11 13:17:33.571	0.1	boxes	1	\N	t	1	\N
905	265	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-10 12:28:36.592	2026-04-11 13:17:36.392	0.1	boxes	1	\N	t	1	\N
904	266	WB Курск FBS	2026-04-10 12:00:00	-	\N	0	1. 0.1 x0.34 = 680₽ | Итого: 680₽	warehouse	2026-04-10 12:16:43.857	2026-04-11 13:52:22.093	0.34	boxes	1	\N	t	1	\N
916	281	WB Курск FBS	2026-04-11 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	shipped	2026-04-11 08:24:09.592	2026-04-11 13:17:00.849	0.1	boxes	1	\N	t	1	\N
919	266	WB Курск FBS	2026-04-11 12:00:00	-	\N	0	1. 0.1 x0.55 = 1100₽ | Итого: 1 100₽	shipped	2026-04-11 12:12:26.856	2026-04-11 13:17:23.586	0.55	boxes	1	\N	t	1	\N
920	192	WB Курск FBS	2026-04-11 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	new	2026-04-11 13:44:37.988	2026-04-11 13:54:50.466	0.1	boxes	1	\N	t	1	\N
921	266	WB Курск FBS	2026-04-11 12:00:00	-	\N	1	\N	archived	2026-04-11 13:53:57.773	2026-04-11 13:55:23.912	0.55	boxes	1	\N	t	1	\N
917	375	WB Курск FBS	2026-04-11 12:00:00	-	\N	0	1. 0.1 x0.1 = 200₽ | Итого: 200₽	shipped	2026-04-11 09:35:36.834	2026-04-11 13:56:50.16	0.1	boxes	1	\N	t	1	\N
918	263	WB Курск FBS	2026-04-11 12:00:00	-	\N	0	1. 0.1 x0.225 = 450₽ | Итого: 450₽	shipped	2026-04-11 12:10:45.082	2026-04-11 13:56:50.162	0.225	boxes	1	\N	t	1	\N
922	303	WB Курск FBS	2026-04-11 12:00:00	-	\N	1	\N	shipped	2026-04-11 13:56:16.618	2026-04-11 13:56:50.164	0.2	boxes	1	\N	t	1	\N
923	223	WB Коледино	2026-05-09 00:00:00	-	0	6	\N	archived	2026-04-12 15:37:27.251	2026-04-12 18:08:01.813	\N	boxes	12	3	t	2	\N
924	273	WB Воронеж	2026-04-15 00:00:00	-	\N	2	1. Большая x2 = 1700₽ | Итого: 1700₽	new	2026-04-12 18:41:20.349	2026-04-12 18:41:20.349	\N	boxes	7	3	f	2	2026-04-15 00:00:00
925	273	WB Котовск	2026-04-15 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 4500₽ | Итого: 4500₽	new	2026-04-12 18:43:12.147	2026-04-12 18:43:12.147	\N	boxes	15	83	f	2	2026-04-15 00:00:00
926	273	WB Екатеринбург (Перспективная 14)	2026-04-20 00:00:00	-	\N	1	1. от 5 до 10 коробок x1 = 7500₽ | Итого: 7500₽	new	2026-04-12 18:48:06.607	2026-04-12 18:48:06.607	\N	boxes	13	83	f	2	2026-04-20 00:00:00
927	254	WB Воронеж	2026-04-15 00:00:00	-	\N	3	1. Средняя x1 = 750₽; 2. Большая x2 = 1700₽ | Итого: 2450₽	new	2026-04-13 07:01:57.532	2026-04-13 07:01:57.532	\N	boxes	7	2	f	2	2026-04-15 00:00:00
928	281	WB Курск FBS	2026-04-13 12:00:00	-	\N	0	1. 0.1 x0.2 = 400₽ | Итого: 400₽	new	2026-04-13 07:25:13.813	2026-04-13 07:25:13.813	0.2	boxes	1	\N	f	1	\N
929	655	WB Электросталь	2026-04-15 00:00:00	-	\N	5	1. Большая x5 = 4950₽ | Итого: 4950₽	new	2026-04-13 08:08:09.932	2026-04-13 08:08:09.932	\N	boxes	17	3	f	2	2026-04-15 00:00:00
930	402	WB Екатеринбург (Перспективная 14)	2026-04-20 00:00:00	-	\N	1	1. Средняя x1 = 1100₽ | Итого: 1100₽	new	2026-04-13 08:55:22.109	2026-04-13 08:55:22.109	\N	boxes	13	2	f	2	2026-04-20 00:00:00
931	402	WB Невинномысск	2026-04-16 00:00:00	-	\N	1	1. Средняя x1 = 890₽ | Итого: 890₽	new	2026-04-13 08:56:43.989	2026-04-13 08:56:43.989	\N	boxes	10	2	f	2	2026-04-16 00:00:00
932	346	WB Коледино	2026-04-15 00:00:00	-	\N	4	1. Большая x4 = 3800₽ | Итого: 3800₽	new	2026-04-13 11:21:21.618	2026-04-13 11:21:21.618	\N	boxes	12	3	f	2	2026-04-15 00:00:00
933	266	WB Курск FBS	2026-04-13 12:00:00	-	\N	0	1. 0.1 x0.92 = 1840₽ | Итого: 1 840₽	new	2026-04-13 11:33:02.953	2026-04-13 11:33:02.953	0.92	boxes	1	\N	f	1	\N
934	266	WB Коледино	2026-04-15 00:00:00	-	\N	10	1. Большая x10 = 9500₽ | Итого: 9500₽	new	2026-04-13 11:34:05.839	2026-04-13 11:34:05.839	\N	boxes	12	3	f	2	2026-04-15 00:00:00
935	186	WB Курск FBS	2026-04-16 12:00:00	-	\N	0	1. 0.1 x0.5 = 1000₽ | Услуги клиента: Забор груза с адреса, Помощь на выгрузке | Итого: 1 550₽	new	2026-04-13 12:04:59.663	2026-04-13 12:05:07.561	0.5	boxes	1	\N	t	1	\N
\.


--
-- Data for Name: warehouse_workers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_workers (id, telegram_id, name, is_active, created_at, email, password) FROM stdin;
3	497135054	Павел	t	2026-03-28 13:56:47.618	\N	\N
4	638740448	Артем	t	2026-03-28 14:52:32.287	\N	\N
1	918858687	Василий	t	2026-03-28 09:06:47.232	\N	\N
6	5616143395	Наталья	t	2026-03-30 07:33:41.337	\N	\N
7	1074888055	Родя	t	2026-03-30 07:59:04.837	\N	\N
9	123456789	Иван Петров	t	2026-04-01 10:07:21.019	warehouse@test.ru	$2a$10$UNpMpxqLRXmouXrWNSd/teeI.4U4AB0PIjG9m3Onswx/1dclk2UXO
10	1534902869	Главный Кладовщик	t	2026-04-04 11:02:05.168	\N	\N
\.


--
-- Name: bank_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_transactions_id_seq', 389, true);


--
-- Name: box_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.box_types_id_seq', 1602, true);


--
-- Name: cities_fbs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cities_fbs_id_seq', 2, true);


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cities_id_seq', 34, true);


--
-- Name: client_service_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_service_prices_id_seq', 4, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 1048, true);


--
-- Name: counterparties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.counterparties_id_seq', 166, true);


--
-- Name: counterparty_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.counterparty_balances_id_seq', 1679, true);


--
-- Name: counterparty_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.counterparty_contacts_id_seq', 261, true);


--
-- Name: delivery_schedules_fbs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_schedules_fbs_id_seq', 32, true);


--
-- Name: delivery_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_schedules_id_seq', 320, true);


--
-- Name: delivery_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_types_id_seq', 2, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 987, true);


--
-- Name: invoice_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_requests_id_seq', 160, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 765, true);


--
-- Name: managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.managers_id_seq', 3, true);


--
-- Name: pallet_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pallet_types_id_seq', 4, true);


--
-- Name: price_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.price_rates_id_seq', 161, true);


--
-- Name: prices_fbs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prices_fbs_id_seq', 1, true);


--
-- Name: request_field_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_field_history_id_seq', 103, true);


--
-- Name: request_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_photos_id_seq', 29, true);


--
-- Name: request_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_services_id_seq', 1283, true);


--
-- Name: request_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_status_history_id_seq', 1301, true);


--
-- Name: service_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_prices_id_seq', 16, true);


--
-- Name: shipment_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipment_requests_id_seq', 967, true);


--
-- Name: warehouse_workers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouse_workers_id_seq', 10, true);


--
-- Name: bank_import_batches bank_import_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_import_batches
    ADD CONSTRAINT bank_import_batches_pkey PRIMARY KEY (id);


--
-- Name: bank_transactions bank_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id);


--
-- Name: box_types box_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.box_types
    ADD CONSTRAINT box_types_pkey PRIMARY KEY (id);


--
-- Name: cities_fbs cities_fbs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities_fbs
    ADD CONSTRAINT cities_fbs_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cities cities_short_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_short_name_key UNIQUE (short_name);


--
-- Name: client_service_prices client_service_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_prices
    ADD CONSTRAINT client_service_prices_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: counterparties counterparties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparties
    ADD CONSTRAINT counterparties_pkey PRIMARY KEY (id);


--
-- Name: counterparty_balances counterparty_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_balances
    ADD CONSTRAINT counterparty_balances_pkey PRIMARY KEY (id);


--
-- Name: counterparty_contacts counterparty_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_contacts
    ADD CONSTRAINT counterparty_contacts_pkey PRIMARY KEY (id);


--
-- Name: delivery_schedules_fbs delivery_schedules_fbs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules_fbs
    ADD CONSTRAINT delivery_schedules_fbs_pkey PRIMARY KEY (id);


--
-- Name: delivery_schedules delivery_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules
    ADD CONSTRAINT delivery_schedules_pkey PRIMARY KEY (id);


--
-- Name: delivery_types delivery_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_types
    ADD CONSTRAINT delivery_types_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_requests invoice_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_requests
    ADD CONSTRAINT invoice_requests_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (id);


--
-- Name: pallet_types pallet_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pallet_types
    ADD CONSTRAINT pallet_types_pkey PRIMARY KEY (id);


--
-- Name: price_rates price_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates
    ADD CONSTRAINT price_rates_pkey PRIMARY KEY (id);


--
-- Name: prices_fbs prices_fbs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices_fbs
    ADD CONSTRAINT prices_fbs_pkey PRIMARY KEY (id);


--
-- Name: request_field_history request_field_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_field_history
    ADD CONSTRAINT request_field_history_pkey PRIMARY KEY (id);


--
-- Name: request_photos request_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_photos
    ADD CONSTRAINT request_photos_pkey PRIMARY KEY (id);


--
-- Name: request_services request_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_services
    ADD CONSTRAINT request_services_pkey PRIMARY KEY (id);


--
-- Name: request_status_history request_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_status_history
    ADD CONSTRAINT request_status_history_pkey PRIMARY KEY (id);


--
-- Name: service_prices service_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_pkey PRIMARY KEY (id);


--
-- Name: shipment_requests shipment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests
    ADD CONSTRAINT shipment_requests_pkey PRIMARY KEY (id);


--
-- Name: warehouse_workers warehouse_workers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_workers
    ADD CONSTRAINT warehouse_workers_pkey PRIMARY KEY (id);


--
-- Name: bank_transactions_document_number_document_date_amount_paye_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bank_transactions_document_number_document_date_amount_paye_key ON public.bank_transactions USING btree (document_number, document_date, amount, payer_inn);


--
-- Name: bank_transactions_document_number_document_date_amount_payer_in; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bank_transactions_document_number_document_date_amount_payer_in ON public.bank_transactions USING btree (document_number, document_date, amount, payer_inn);


--
-- Name: box_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX box_types_name_key ON public.box_types USING btree (name);


--
-- Name: cities_fbs_short_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cities_fbs_short_name_key ON public.cities_fbs USING btree (short_name);


--
-- Name: clients_telegram_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clients_telegram_id_key ON public.clients USING btree (telegram_id);


--
-- Name: counterparties_inn_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX counterparties_inn_key ON public.counterparties USING btree (inn);


--
-- Name: counterparty_balances_counterparty_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX counterparty_balances_counterparty_id_key ON public.counterparty_balances USING btree (counterparty_id);


--
-- Name: counterparty_contacts_counterparty_id_client_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX counterparty_contacts_counterparty_id_client_id_key ON public.counterparty_contacts USING btree (counterparty_id, client_id);


--
-- Name: delivery_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX delivery_types_name_key ON public.delivery_types USING btree (name);


--
-- Name: invoice_requests_invoice_id_request_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoice_requests_invoice_id_request_id_key ON public.invoice_requests USING btree (invoice_id, request_id);


--
-- Name: invoices_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_number_key ON public.invoices USING btree (number);


--
-- Name: invoices_tbank_order_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_tbank_order_id_key ON public.invoices USING btree (tbank_order_id);


--
-- Name: invoices_tbank_payment_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_tbank_payment_id_key ON public.invoices USING btree (tbank_payment_id);


--
-- Name: managers_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX managers_email_key ON public.managers USING btree (email);


--
-- Name: pallet_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pallet_types_name_key ON public.pallet_types USING btree (name);


--
-- Name: price_rates_city_id_unit_box_type_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rates_city_id_unit_box_type_id_idx ON public.price_rates USING btree (city_id, unit, box_type_id);


--
-- Name: price_rates_city_id_unit_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rates_city_id_unit_idx ON public.price_rates USING btree (city_id, unit);


--
-- Name: price_rates_city_id_unit_pallet_type_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rates_city_id_unit_pallet_type_id_idx ON public.price_rates USING btree (city_id, unit, pallet_type_id);


--
-- Name: request_photos_request_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX request_photos_request_id_idx ON public.request_photos USING btree (request_id);


--
-- Name: warehouse_workers_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX warehouse_workers_email_key ON public.warehouse_workers USING btree (email);


--
-- Name: warehouse_workers_telegram_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX warehouse_workers_telegram_id_key ON public.warehouse_workers USING btree (telegram_id);


--
-- Name: bank_transactions bank_transactions_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bank_transactions bank_transactions_import_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_import_batch_id_fkey FOREIGN KEY (import_batch_id) REFERENCES public.bank_import_batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: client_service_prices client_service_prices_delivery_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_prices
    ADD CONSTRAINT client_service_prices_delivery_type_id_fkey FOREIGN KEY (delivery_type_id) REFERENCES public.delivery_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: counterparty_balances counterparty_balances_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_balances
    ADD CONSTRAINT counterparty_balances_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: counterparty_contacts counterparty_contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_contacts
    ADD CONSTRAINT counterparty_contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: counterparty_contacts counterparty_contacts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparty_contacts
    ADD CONSTRAINT counterparty_contacts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delivery_schedules delivery_schedules_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules
    ADD CONSTRAINT delivery_schedules_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delivery_schedules_fbs delivery_schedules_fbs_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_schedules_fbs
    ADD CONSTRAINT delivery_schedules_fbs_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities_fbs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_requests invoice_requests_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_requests
    ADD CONSTRAINT invoice_requests_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_requests invoice_requests_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_requests
    ADD CONSTRAINT invoice_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.shipment_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_rates price_rates_box_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates
    ADD CONSTRAINT price_rates_box_type_id_fkey FOREIGN KEY (box_type_id) REFERENCES public.box_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: price_rates price_rates_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates
    ADD CONSTRAINT price_rates_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_rates price_rates_pallet_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates
    ADD CONSTRAINT price_rates_pallet_type_id_fkey FOREIGN KEY (pallet_type_id) REFERENCES public.pallet_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: request_field_history request_field_history_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_field_history
    ADD CONSTRAINT request_field_history_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.managers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_field_history request_field_history_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_field_history
    ADD CONSTRAINT request_field_history_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.shipment_requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_photos request_photos_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_photos
    ADD CONSTRAINT request_photos_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.shipment_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: request_services request_services_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_services
    ADD CONSTRAINT request_services_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.shipment_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: request_status_history request_status_history_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_status_history
    ADD CONSTRAINT request_status_history_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.shipment_requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shipment_requests shipment_requests_box_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests
    ADD CONSTRAINT shipment_requests_box_type_id_fkey FOREIGN KEY (box_type_id) REFERENCES public.box_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shipment_requests shipment_requests_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests
    ADD CONSTRAINT shipment_requests_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shipment_requests shipment_requests_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests
    ADD CONSTRAINT shipment_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shipment_requests shipment_requests_delivery_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipment_requests
    ADD CONSTRAINT shipment_requests_delivery_type_id_fkey FOREIGN KEY (delivery_type_id) REFERENCES public.delivery_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict XSUHxIEo9nHxpdsOe63xvffL9O4QDbJX70AMvuUbX3pQe7AoiZl87qOZVvc249N


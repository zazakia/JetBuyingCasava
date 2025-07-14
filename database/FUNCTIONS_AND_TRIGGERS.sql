-- Database Functions and Triggers for JetBuyingCasava

-- 1. Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- 2. Function to handle user registration (creates user profile)
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.jetbuyingcasava_users (
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'),
        COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to log important events
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.jetbuyingcasava_activity_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to update search vectors for full-text search
CREATE OR REPLACE FUNCTION update_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
    -- Example for farmers table
    IF TG_TABLE_NAME = 'jetbuyingcasava_farmers' THEN
        NEW.search_vector := to_tsvector('english', 
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.phone, '') || ' ' ||
            COALESCE(NEW.address, '')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create triggers for automatic timestamps
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'jetbuyingcasava_%'
        AND table_type = 'BASE TABLE'
    LOOP
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_modtime ON %I', t.table_name, t.table_name);
        
        -- Create new trigger
        EXECUTE format('CREATE TRIGGER update_%s_modtime
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_modified_column()',
            t.table_name, t.table_name);
            
        -- Add updated_at column if it doesn't exist
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()', 
                      t.table_name);
    END LOOP;
END $$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create activity log triggers for important tables
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'jetbuyingcasava_farmers',
            'jetbuyingcasava_lands',
            'jetbuyingcasava_crops',
            'jetbuyingcasava_transactions',
            'jetbuyingcasava_users'
        )
    LOOP
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS log_%s_activity ON %I', t.table_name, t.table_name);
        
        -- Create new trigger
        EXECUTE format('CREATE TRIGGER log_%s_activity
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION log_activity()',
            t.table_name, t.table_name);
    END LOOP;
END $$;

-- Enable RLS on activity logs
ALTER TABLE public.jetbuyingcasava_activity_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.jetbuyingcasava_activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create search vector columns and indexes for full-text search
DO $$
BEGIN
    -- For farmers table
    EXECUTE 'ALTER TABLE public.jetbuyingcasava_farmers ADD COLUMN IF NOT EXISTS search_vector tsvector';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_farmers_search ON public.jetbuyingcasava_farmers USING gin(search_vector)';
    
    -- For other tables as needed
    -- EXECUTE 'ALTER TABLE public.jetbuyingcasava_lands ADD COLUMN IF NOT EXISTS search_vector tsvector';
    -- EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lands_search ON public.jetbuyingcasava_lands USING gin(search_vector)';
    
    -- Create triggers to update search vectors
    EXECUTE 'CREATE OR REPLACE TRIGGER update_farmers_search_vector
        BEFORE INSERT OR UPDATE ON public.jetbuyingcasava_farmers
        FOR EACH ROW EXECUTE FUNCTION update_search_vectors()';
        
    -- Update existing rows
    EXECUTE 'UPDATE public.jetbuyingcasava_farmers SET search_vector = to_tsvector(''english'', 
        COALESCE(first_name, '''') || '' '' ||
        COALESCE(last_name, '''') || '' '' ||
        COALESCE(phone, '''') || '' '' ||
        COALESCE(address, ''''))';
END $$;

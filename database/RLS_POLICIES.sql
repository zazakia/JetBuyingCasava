-- Enable Row Level Security on all tables
ALTER TABLE public.jetbuyingcasava_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jetbuyingcasava_lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jetbuyingcasava_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jetbuyingcasava_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for jetbuyingcasava_farmers
CREATE POLICY "Users can view their own farmers"
ON public.jetbuyingcasava_farmers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farmers"
ON public.jetbuyingcasava_farmers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farmers"
ON public.jetbuyingcasava_farmers
FOR UPDATE USING (auth.uid() = user_id);

-- Policies for jetbuyingcasava_lands
CREATE POLICY "Users can view their own lands"
ON public.jetbuyingcasava_lands
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.jetbuyingcasava_farmers 
  WHERE id = farmer_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert lands for their farmers"
ON public.jetbuyingcasava_lands
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jetbuyingcasava_farmers 
    WHERE id = farmer_id AND user_id = auth.uid()
  )
);

-- Similar policies for other tables...

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view their own profile"
ON auth.users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON auth.users
FOR UPDATE
USING (auth.uid() = id);

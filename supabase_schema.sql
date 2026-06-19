-- =======================================================
-- MENUXPRO DATABASE SCHEMA FOR SUPABASE POSTGRESQL
-- Matches Prisma schema configuration with Realtime enabled
-- =======================================================

-- 1. Create Restaurant Table
CREATE TABLE "Restaurant" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    currency VARCHAR(10) DEFAULT 'TND' NOT NULL,
    "cuisineType" VARCHAR(255),
    address TEXT,
    "logoUrl" TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    "ownerUid" VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'FREE' NOT NULL,
    "slugType" VARCHAR(50) DEFAULT 'FREE_RANDOM' NOT NULL,
    "watermarkEnabled" BOOLEAN DEFAULT TRUE NOT NULL,
    "maxMenuItems" INTEGER DEFAULT 50 NOT NULL,
    branding JSONB,
    "primaryColor" VARCHAR(50),
    "accentColor" VARCHAR(50),
    "openingHours" JSONB,
    "staffUids" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create Table Table (double quotes used since "Table" is a SQL reserved keyword)
CREATE TABLE "Table" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "restaurantId" UUID NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    seats INTEGER DEFAULT 2 NOT NULL,
    status VARCHAR(50) DEFAULT 'EMPTY' NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "activeOrderId" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create Order Table (double quotes used since "Order" is a SQL reserved keyword)
CREATE TABLE "Order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "restaurantId" UUID NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "tableId" UUID NOT NULL REFERENCES "Table"(id) ON DELETE CASCADE,
    "tableName" VARCHAR(255) NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATED' NOT NULL,
    notes TEXT,
    "customerNote" TEXT,
    "customerName" VARCHAR(255),
    "rejectReason" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acceptedAt" TIMESTAMP WITH TIME ZONE,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "closedAt" TIMESTAMP WITH TIME ZONE,
    "cancelledAt" TIMESTAMP WITH TIME ZONE
);

-- Add circular reference constraint to "Table" for activeOrder
ALTER TABLE "Table" ADD CONSTRAINT fk_active_order FOREIGN KEY ("activeOrderId") REFERENCES "Order"(id) ON DELETE SET NULL;

-- 4. Create OrderItem Table
CREATE TABLE "OrderItem" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    notes TEXT
);

-- 5. Create ActivityLog Table
CREATE TABLE "ActivityLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "restaurantId" UUID NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "actorId" VARCHAR(255),
    "actorName" VARCHAR(255),
    "actorRole" VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    "targetType" VARCHAR(100) NOT NULL,
    "targetId" VARCHAR(255) NOT NULL,
    before JSONB,
    after JSONB,
    reason TEXT,
    message TEXT,
    metadata JSONB,
    "userId" VARCHAR(255),
    "userName" VARCHAR(255),
    "tableId" VARCHAR(255),
    "orderId" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Create TableRequest Table
CREATE TABLE "TableRequest" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "restaurantId" UUID NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
    "tableId" UUID NOT NULL REFERENCES "Table"(id) ON DELETE CASCADE,
    "tableName" VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acknowledgedAt" TIMESTAMP WITH TIME ZONE,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "acknowledgedBy" VARCHAR(255),
    "resolvedBy" VARCHAR(255)
);

-- 7. Add updatedAt triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_changetimestamp BEFORE UPDATE ON "Restaurant" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_table_changetimestamp BEFORE UPDATE ON "Table" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_order_changetimestamp BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 8. Enable Supabase Realtime for Realtime features
-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
ALTER PUBLICATION supabase_realtime ADD TABLE "Table";
ALTER PUBLICATION supabase_realtime ADD TABLE "TableRequest";

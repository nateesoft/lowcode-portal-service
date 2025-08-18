-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100) DEFAULT 'active',
    permissions JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    color VARCHAR(50),
    icon VARCHAR(100),
    "isSystem" BOOLEAN DEFAULT FALSE,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_group_members junction table
CREATE TABLE IF NOT EXISTS user_group_members (
    "userGroupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    PRIMARY KEY ("userGroupId", "userId"),
    FOREIGN KEY ("userGroupId") REFERENCES user_groups(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_groups_created_by ON user_groups("createdById");
CREATE INDEX IF NOT EXISTS idx_user_groups_status ON user_groups(status);
CREATE INDEX IF NOT EXISTS idx_user_groups_name ON user_groups(name);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members("userId");
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members("userGroupId");

-- Update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_user_groups_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_groups_updated_at 
    BEFORE UPDATE ON user_groups 
    FOR EACH ROW EXECUTE FUNCTION update_user_groups_updated_at_column();

-- Insert some default user groups (optional)
INSERT INTO user_groups (name, description, status, permissions, "isSystem", "createdById") 
VALUES 
    ('Administrators', 'System administrators with full access', 'active', '["admin.*"]', TRUE, 1),
    ('Developers', 'Application developers', 'active', '["project.create", "project.edit", "component.create", "component.edit"]', TRUE, 1),
    ('Viewers', 'Read-only access users', 'active', '["project.view", "component.view"]', TRUE, 1)
ON CONFLICT DO NOTHING;
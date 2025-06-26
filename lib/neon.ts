import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

let isInitialized = false

// Initialize database schema
export async function initializeDatabase() {
  if (isInitialized) return

  try {
    console.log("Initializing database...")

    // Create users table first
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        avatar TEXT,
        provider VARCHAR(50) NOT NULL DEFAULT 'email',
        social_id TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        prep_time_minutes INTEGER DEFAULT 0,
        cook_time_minutes INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create recipe ingredients table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient VARCHAR(255) NOT NULL,
        amount VARCHAR(50),
        unit VARCHAR(50),
        order_index INTEGER DEFAULT 0
      )
    `

    // Create recipe instructions table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_instructions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        instruction TEXT NOT NULL,
        step_number INTEGER NOT NULL
      )
    `

    // Create recipe tags table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL
      )
    `

    // Create user sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_author ON recipes(author_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(moderation_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)`

    // Insert a sample admin user if no users exist
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    if (userCount[0].count === 0) {
      await sql`
        INSERT INTO users (username, email, role, is_verified)
        VALUES ('admin', 'admin@jtdrecipe.com', 'admin', true)
      `
      console.log("Created default admin user")
    }

    // Insert some sample recipes if none exist
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    if (recipeCount[0].count === 0) {
      const adminUser = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`
      if (adminUser.length > 0) {
        const adminId = adminUser[0].id

        // Sample recipe 1
        const recipe1 = await sql`
          INSERT INTO recipes (
            title, description, author_id, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings,
            moderation_status, is_published, rating, review_count, view_count
          ) VALUES (
            'Classic Chocolate Chip Cookies',
            'Perfect chewy chocolate chip cookies that everyone will love.',
            ${adminId}, 'Desserts', 'Easy',
            15, 12, 24,
            'approved', true, 4.8, 156, 2341
          ) RETURNING id
        `

        // Add ingredients for recipe 1
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit, order_index)
          VALUES 
            (${recipe1[0].id}, 'All-purpose flour', '2 1/4', 'cups', 0),
            (${recipe1[0].id}, 'Baking soda', '1', 'tsp', 1),
            (${recipe1[0].id}, 'Salt', '1', 'tsp', 2),
            (${recipe1[0].id}, 'Butter, softened', '1', 'cup', 3),
            (${recipe1[0].id}, 'Granulated sugar', '3/4', 'cup', 4),
            (${recipe1[0].id}, 'Brown sugar', '3/4', 'cup', 5),
            (${recipe1[0].id}, 'Vanilla extract', '2', 'tsp', 6),
            (${recipe1[0].id}, 'Large eggs', '2', 'whole', 7),
            (${recipe1[0].id}, 'Chocolate chips', '2', 'cups', 8)
        `

        // Add instructions for recipe 1
        await sql`
          INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
          VALUES 
            (${recipe1[0].id}, 'Preheat oven to 375°F (190°C).', 1),
            (${recipe1[0].id}, 'In a small bowl, combine flour, baking soda, and salt.', 2),
            (${recipe1[0].id}, 'In a large bowl, beat butter and both sugars until creamy.', 3),
            (${recipe1[0].id}, 'Beat in vanilla and eggs one at a time.', 4),
            (${recipe1[0].id}, 'Gradually blend in flour mixture.', 5),
            (${recipe1[0].id}, 'Stir in chocolate chips.', 6),
            (${recipe1[0].id}, 'Drop rounded tablespoons of dough onto ungreased cookie sheets.', 7),
            (${recipe1[0].id}, 'Bake 9-11 minutes or until golden brown.', 8),
            (${recipe1[0].id}, 'Cool on baking sheets for 2 minutes; remove to wire rack.', 9)
        `

        // Add tags for recipe 1
        await sql`
          INSERT INTO recipe_tags (recipe_id, tag)
          VALUES 
            (${recipe1[0].id}, 'cookies'),
            (${recipe1[0].id}, 'chocolate'),
            (${recipe1[0].id}, 'dessert'),
            (${recipe1[0].id}, 'baking')
        `

        // Sample recipe 2
        const recipe2 = await sql`
          INSERT INTO recipes (
            title, description, author_id, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings,
            moderation_status, is_published, rating, review_count, view_count
          ) VALUES (
            'Perfect Scrambled Eggs',
            'Creamy, fluffy scrambled eggs made the right way.',
            ${adminId}, 'Breakfast', 'Easy',
            5, 5, 2,
            'approved', true, 4.6, 89, 1205
          ) RETURNING id
        `

        // Add ingredients for recipe 2
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit, order_index)
          VALUES 
            (${recipe2[0].id}, 'Large eggs', '6', 'whole', 0),
            (${recipe2[0].id}, 'Butter', '2', 'tbsp', 1),
            (${recipe2[0].id}, 'Heavy cream', '2', 'tbsp', 2),
            (${recipe2[0].id}, 'Salt', '1/2', 'tsp', 3),
            (${recipe2[0].id}, 'Black pepper', '1/4', 'tsp', 4),
            (${recipe2[0].id}, 'Chives, chopped', '1', 'tbsp', 5)
        `

        // Add instructions for recipe 2
        await sql`
          INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
          VALUES 
            (${recipe2[0].id}, 'Crack eggs into a bowl and whisk with cream, salt, and pepper.', 1),
            (${recipe2[0].id}, 'Heat butter in a non-stick pan over low heat.', 2),
            (${recipe2[0].id}, 'Pour in egg mixture and let sit for 20 seconds.', 3),
            (${recipe2[0].id}, 'Gently stir with a spatula, pushing eggs from edges to center.', 4),
            (${recipe2[0].id}, 'Continue cooking and stirring gently until eggs are just set.', 5),
            (${recipe2[0].id}, 'Remove from heat and garnish with chives.', 6)
        `

        console.log("Created sample recipes")
      }
    }

    isInitialized = true
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
    // Fix: Check if error exists and has message property
    const errorMessage =
      error && typeof error === "object" && "message" in error ? (error as Error).message : "Unknown database error"
    throw new Error(`Database initialization failed: ${errorMessage}`)
  }
}

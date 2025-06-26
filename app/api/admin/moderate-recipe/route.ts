import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function POST(request: Request) {
  try {
    await initializeDatabase()

    const { recipeId, status, notes } = await request.json()

    if (!recipeId || !status) {
      return NextResponse.json({ success: false, error: "Recipe ID and status are required" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Status must be 'approved' or 'rejected'" }, { status: 400 })
    }

    // Start a transaction to ensure data consistency
    await sql.begin(async (sql) => {
      // Update recipe status
      await sql`
        UPDATE recipes 
        SET 
          moderation_status = ${status}, 
          is_published = ${status === "approved"},
          moderation_notes = ${notes || null},
          updated_at = NOW()
        WHERE id = ${recipeId}
      `

      // If approved, ensure the recipe is properly indexed for search
      if (status === "approved") {
        // Update search index or any other post-approval processing
        await sql`
          UPDATE recipes 
          SET 
            search_vector = to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || category)
          WHERE id = ${recipeId}
        `
      }
    })

    // Get the updated recipe with full details
    const updatedRecipe = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
          ) FILTER (WHERE ri.ingredient IS NOT NULL), 
          '[]'::json
        ) as ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'instruction', inst.instruction,
              'step_number', inst.step_number
            )
            ORDER BY inst.step_number
          ) FILTER (WHERE inst.instruction IS NOT NULL), 
          '[]'::json
        ) as instructions
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
      WHERE r.id = ${recipeId}
      GROUP BY r.id, u.username
    `

    if (updatedRecipe.length === 0) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    // If approved, send notification email to author (optional)
    if (status === "approved") {
      try {
        // You can add email notification here if needed
        console.log(`Recipe "${updatedRecipe[0].title}" approved and published`)
      } catch (emailError) {
        console.error("Failed to send approval notification:", emailError)
        // Don't fail the whole operation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recipe ${status} successfully`,
      recipe: {
        id: updatedRecipe[0].id,
        title: updatedRecipe[0].title,
        status: updatedRecipe[0].moderation_status,
        is_published: updatedRecipe[0].is_published,
      },
    })
  } catch (error) {
    console.error("Failed to moderate recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to moderate recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

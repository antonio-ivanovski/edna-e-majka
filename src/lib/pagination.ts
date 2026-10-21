/**
 * How many cards a list page asks for at a time.
 *
 * Lives here rather than in the query module so pages can read it without
 * pulling the database layer into the browser bundle.
 */
export const PRODUCT_PAGE_SIZE = 24

/**
 * The endless list grows by a page at a time, but it never holds more than
 * this many cards: a catalogue with thousands of products would otherwise be
 * sent to the browser in one piece.
 */
export const MAX_CATALOGUE_ITEMS = 240

/** Admin tables are read in the dashboard, so the rows are denser and fewer. */
export const ADMIN_PAGE_SIZE = 25

/** The owner's own table of products, in the dashboard. */
export const MANAGE_PAGE_SIZE = 20

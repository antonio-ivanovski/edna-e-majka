/**
 * How many cards a list page asks for at a time.
 *
 * Lives here rather than in the query module so pages can read it without
 * pulling the database layer into the browser bundle.
 */
export const PRODUCT_PAGE_SIZE = 24

/**
 * Paged: each page renders PRODUCT_PAGE_SIZE cards and the pager navigates
 * via `?page=`. The catalogue never spans more than this many cards across
 * all pages: a catalogue with thousands of products would otherwise be sent
 * to the browser in one piece.
 */
export const MAX_CATALOGUE_ITEMS = 240

/** Admin tables are read in the dashboard, so the rows are denser and fewer. */
export const ADMIN_PAGE_SIZE = 25

/** The owner's own table of products, in the dashboard. */
export const MANAGE_PAGE_SIZE = 20

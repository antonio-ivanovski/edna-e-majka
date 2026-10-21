/**
 * How many cards a list page asks for at a time.
 *
 * Lives here rather than in the query module so pages can read it without
 * pulling the database layer into the browser bundle.
 */
export const PRODUCT_PAGE_SIZE = 24

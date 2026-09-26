/**
 * The site's Worker. Pages are static assets (HonoX's SSG output in dist/);
 * wrangler.jsonc routes only /api/* here.
 */
import api from "../app/api/preset"

export default api

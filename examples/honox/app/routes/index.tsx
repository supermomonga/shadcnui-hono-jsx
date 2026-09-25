import { createRoute } from "honox/factory"
import { Demo } from "../demo"

export default createRoute((c) => c.render(<Demo runtime="HonoX" />))

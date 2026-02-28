import { email, z } from "zod";

export const UserPayloadSchema = z.object({
    email: z.string().nonempty(),
    active: z.boolean().default(true)
})



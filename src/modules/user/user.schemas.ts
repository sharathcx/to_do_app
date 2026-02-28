import { email, z } from "zod";

export const UserPayloadSchema = z.object({
    body: z.object({
        email: z.string().nonempty(),
        active: z.boolean().default(true)
    })
})



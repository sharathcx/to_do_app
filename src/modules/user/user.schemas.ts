import { email, z } from "zod";

export const UserPayloadSchema = z.object({
    body: {
        email: z.string().nonempty(),
        active: z.boolean().default(true)
    }
})



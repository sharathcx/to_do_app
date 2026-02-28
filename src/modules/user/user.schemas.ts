import { email, z } from "zod";

export const UserSchema = z.object({
    userId: z.string().nonempty(),
    email: z.string().nonempty(),
    emailVerified: z.boolean().default(false),
    active: z.boolean().default(true)
})
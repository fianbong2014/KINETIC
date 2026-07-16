import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** UI hint only — enforcement always re-checks the DB. Absent on tokens issued before roles existed. */
      role?: "USER" | "ADMIN";
    };
  }
}

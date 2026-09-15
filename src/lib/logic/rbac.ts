import { Role } from "@prisma/client";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(pesan = "Kamu tidak berhak mengakses data ini.") {
    super(pesan);
    this.name = "ForbiddenError";
  }
}

export type SessionUser = {
  id: string;
  role: Role;
};

export function requireRole(
  user: SessionUser | null | undefined,
  ...roles: Role[]
): SessionUser {
  if (!user) throw new ForbiddenError("Silakan masuk terlebih dahulu.");
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export function requireDataSiswa(
  user: SessionUser,
  siswaId: string
): void {
  switch (user.role) {
    case "STUDENT":
      if (user.id !== siswaId) throw new ForbiddenError();
      return;
    case "ADMIN":
    case "TEACHER":
    case "DUDI":
      return;
    default:
      throw new ForbiddenError();
  }
}

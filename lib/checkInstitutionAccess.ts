import dbConnect from "@/lib/db";
import Institution from "@/lib/models/Institution";

type Role = "owner" | "admin" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  viewer: 1,
};

export async function checkInstitutionAccess(
  userId: string,
  institutionId: string,
  required: Role = "viewer"
) {
  await dbConnect();

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    throw new Error("404: Institution not found");
  }

  // Check if user is the direct owner defined in ownerId
  if (institution.ownerId === userId) {
    return institution;
  }

  // Check if user is in members array
  const member = institution.members.find((m: any) => m.userId === userId);

  if (!member) {
    throw new Error("403: Access denied. User is not a member of this institution.");
  }

  // Check role hierarchy
  if (ROLE_HIERARCHY[member.role as Role] < ROLE_HIERARCHY[required]) {
    throw new Error(`403: Access denied. Required role: ${required}`);
  }

  return institution;
}

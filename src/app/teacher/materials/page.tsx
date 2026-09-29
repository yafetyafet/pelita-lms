import { getTeacherMaterials } from "@/app/actions/teacher"
import { IsiMateriGuru } from "./IsiMateriGuru"

export default async function Page() {
  const awal = await getTeacherMaterials()
  return <IsiMateriGuru awal={awal} />
}

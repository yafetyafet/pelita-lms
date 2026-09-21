import { getCurrentUser } from "@/app/actions/auth"
import { getForumDiscussions } from "@/app/actions/forum"
import { IsiForum } from "./IsiForum"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Kedua aksi dijalankan berbarengan di server, bukan dua permintaan HTTP dari
 * peramban seperti sebelumnya.
 */
export default async function Page() {
  const [me, diskusi] = await Promise.all([getCurrentUser(), getForumDiscussions()])
  return <IsiForum awal={{ me, diskusi }} />
}

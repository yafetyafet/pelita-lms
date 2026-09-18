/**
 * Bentuk balikan seragam untuk semua Server Action.
 *
 * Tanpa tipe eksplisit, TypeScript menyimpulkan balikan action sebagai union
 * `{ success: true } | { error: string }`. Union itu tidak bisa dibaca
 * dengan pola `if (res.error)` yang dipakai di seluruh halaman, karena
 * `error` tidak ada di cabang sukses. Menjadikan kedua field opsional
 * membuat pola tersebut tetap berlaku sekaligus menjaga field tambahan
 * (`count`, `pesan`, dan sejenisnya) tetap bertipe.
 */
export type AksiHasil<T extends object = Record<never, never>> = Partial<T> & {
  success?: boolean
  error?: string
}

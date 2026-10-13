import { cx } from '@/lib/cx'
import { removeAt, replaceAt } from '../../utils/draft'
import { MATERIAL_KINDS, materialName, newMaterial } from '../../utils/testDraft'
import { InputField, MediaPicker, TextAreaField } from '../fields'

/**
 * Scenario 24, branch 5a: listening or reading material shared by several questions of a part (tbl_test_material).
 * Removing one unlinks its questions instead of leaving them pointing at nothing.
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {Record<string, Record<string, string>>} props.errors problems of each material, by key
 * @param {boolean} props.locked
 * @param {(draft: object) => void} props.onChange
 */
export function TestMaterials({ draft, errors, locked, onChange }) {
  const materials = draft.materials
  const setMaterials = (next) => onChange({ ...draft, materials: next })
  const usedBy = (material) => draft.questions.filter((question) => question.materialKey === material.key).length

  function remove(index) {
    const key = materials[index].key
    onChange({
      ...draft,
      materials: removeAt(materials, index),
      questions: draft.questions.map((question) => (question.materialKey === key ? { ...question, materialKey: null } : question)),
    })
  }

  if (locked && materials.length === 0) return null
  return (
    <section aria-labelledby="test-materials" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="test-materials" className="text-base font-bold text-ink">
          Tài liệu dùng chung ({materials.length})
        </h2>
        <span className="text-label text-muted-strong">Một bài nghe hoặc bài đọc cho nhiều câu của cùng một phần</span>
      </div>
      {materials.map((material, index) => {
        const materialErrors = errors[material.key] ?? {}
        const update = (change) => setMaterials(replaceAt(materials, index, { ...material, ...change }))
        const name = materialName(materials, material)
        const count = usedBy(material)
        return (
          <article
            key={material.key}
            aria-label={name}
            className={cx('flex flex-col gap-4 rounded-xl border bg-white px-5.5 py-5', Object.keys(materialErrors).length > 0 ? 'border-danger-solid' : 'border-line')}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-sm font-bold text-ink">{name}</h3>
              <span className="text-label text-muted-strong">{count > 0 ? `Dùng cho ${count} câu` : 'Chưa có câu nào dùng'}</span>
              {!locked && (
                <button type="button" onClick={() => remove(index)} className="ml-auto cursor-pointer rounded-md px-2.5 py-1 text-label font-bold text-danger hover:bg-danger-bg">
                  Xóa tài liệu
                </button>
              )}
            </div>
            <InputField label="Tiêu đề (không bắt buộc)" disabled={locked} value={material.title} onChange={(event) => update({ title: event.target.value })} />
            {material.type === 'LISTENING' ? (
              <>
                <MediaPicker
                  kind="AUDIO"
                  label="File âm thanh *"
                  value={material.audioUrl}
                  onChange={(audioUrl) => update({ audioUrl })}
                  maxBytes={10 * 1024 * 1024}
                  emptyTitle="Chưa có file âm thanh"
                  emptyNote="Người học nghe bài này rồi trả lời các câu dùng nó."
                  error={materialErrors.audioUrl}
                  allowUrl
                  disabled={locked}
                />
                <TextAreaField
                  label="Lời thoại (không bắt buộc)"
                  lang="en"
                  rows={3}
                  disabled={locked}
                  value={material.transcript}
                  onChange={(event) => update({ transcript: event.target.value })}
                  hint="Chỉ hiện cho người học sau khi nộp bài."
                />
              </>
            ) : (
              <TextAreaField
                label="Nội dung bài đọc *"
                lang="en"
                rows={6}
                disabled={locked}
                value={material.text}
                error={materialErrors.text}
                onChange={(event) => update({ text: event.target.value })}
              />
            )}
          </article>
        )
      })}
      {!locked && (
        <div className="flex flex-wrap gap-2">
          {['LISTENING', 'READING'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMaterials([...materials, newMaterial(type)])}
              className="cursor-pointer rounded-full border border-dashed border-brand-tint-line bg-white px-3.5 py-2 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
            >
              + {MATERIAL_KINDS[type]} chung
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

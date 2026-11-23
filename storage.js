const DB_NAME = 'studyspace-db'
const STORE = 'cards'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCards() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveCard(card) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(card)
    request.onsuccess = () => resolve(card)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCard(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
    request.onsuccess = resolve
    request.onerror = () => reject(request.error)
  })
}

export async function seedIfEmpty() {
  const existing = await getCards()
  if (existing.length) return existing
  const examples = [
    ['What is plucking?', 'A process where ice freezes onto rock and pulls pieces away as a glacier moves.', 'Geography', 'Basic'],
    ['Define abrasion.', 'Rock fragments carried by a glacier scrape and wear away the underlying rock.', 'Geography', 'Definition'],
    ['What is a moraine?', 'Material deposited by a glacier.', 'Geography', 'Basic'],
    ['What is a cell?', 'The basic structural and functional unit of living organisms.', 'Biology', 'Definition'],
    ['What does the nucleus do?', 'Contains genetic material and controls cell activities.', 'Biology', 'Basic'],
    ['When did World War 2 begin?', '1939.', 'History', 'Basic'],
  ]
  const cards = examples.map(([front, back, subject, type]) => ({
    id: crypto.randomUUID(), front, back, subject, type, tags: '', image: null,
    labels: [], createdAt: Date.now(), dueAt: Date.now(), interval: 0,
    reviews: 0, correct: 0, mastered: false
  }))
  await Promise.all(cards.map(saveCard))
  return cards
}
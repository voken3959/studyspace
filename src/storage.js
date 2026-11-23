const DB_NAME = 'studyspace-db'
const STORE = 'cards'
const SETTINGS = 'settings'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transaction(store, mode, action) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(store, mode).objectStore(store))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getCards = () => transaction(STORE, 'readonly', store => store.getAll())
export const saveCard = card => transaction(STORE, 'readwrite', store => store.put(card))
export const deleteCard = id => transaction(STORE, 'readwrite', store => store.delete(id))
export const saveCards = async cards => Promise.all(cards.map(saveCard))
export async function getSetting(key, fallback) {
  const result = await transaction(SETTINGS, 'readonly', store => store.get(key))
  return result?.value ?? fallback
}
export const saveSetting = (key, value) => transaction(SETTINGS, 'readwrite', store => store.put({ key, value }))

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
    id: crypto.randomUUID(), front, back, subject, type, tags: '', image: null, labels: [],
    createdAt: Date.now(), dueAt: Date.now(), interval: 0, reviews: 0, correct: 0, mastered: false
  }))
  await saveCards(cards)
  return cards
}

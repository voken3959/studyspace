import React, { useEffect, useMemo, useState } from 'react'
import {
  Home, Library, Plus, Brain, ChartNoAxesColumn, Search, ChevronRight,
  ArrowLeft, ImagePlus, X, Check, RotateCcw, BookOpen, Layers, Trash2,
  Tag, CalendarDays, Sparkles, Menu
} from 'lucide-react'
import { getCards, saveCard, deleteCard, seedIfEmpty } from './storage'

const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const blank = { front: '', back: '', subject: 'Geography', type: 'Basic', tags: '', image: null, labels: [] }

export default function App() {
  const [cards, setCards] = useState([])
  const [page, setPage] = useState('home')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [session, setSession] = useState([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [reviewed, setReviewed] = useState(0)
  const [ratings, setRatings] = useState({ Again: 0, Hard: 0, Good: 0, Easy: 0 })
  const [labelName, setLabelName] = useState('')
  const [labelPoint, setLabelPoint] = useState(null)

  useEffect(() => { seedIfEmpty().then(setCards).catch(() => notify('Could not open local storage.')) }, [])

  function notify(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2400)
  }
  async function refresh() { setCards(await getCards()) }
  function navigate(next) {
    setPage(next)
    if (next === 'study') startStudy()
    if (next === 'create') { setForm(blank); setEditing(null); setLabelPoint(null) }
  }
  function startStudy() {
    const now = Date.now()
    const due = cards.filter(c => !c.dueAt || c.dueAt <= now)
    setSession(due.length ? due : cards)
    setIndex(0); setRevealed(false); setAnswerText('')
  }
  function updateForm(key, value) { setForm(current => ({ ...current, [key]: value })) }
  async function saveCurrent(e) {
    e.preventDefault()
    if (!form.front.trim() || !form.back.trim()) return notify('Add both a prompt and an answer.')
    if ((form.type === 'Image' || form.type === 'Image labels') && !form.image) return notify('Please upload an image.')
    const card = {
      ...form, id: editing || crypto.randomUUID(),
      createdAt: editing ? cards.find(c => c.id === editing)?.createdAt : Date.now(),
      dueAt: editing ? cards.find(c => c.id === editing)?.dueAt : Date.now(),
      interval: editing ? cards.find(c => c.id === editing)?.interval || 0 : 0,
      reviews: editing ? cards.find(c => c.id === editing)?.reviews || 0 : 0,
      correct: editing ? cards.find(c => c.id === editing)?.correct || 0 : 0,
      mastered: editing ? cards.find(c => c.id === editing)?.mastered || false : false,
    }
    await saveCard(card); await refresh(); setPage('library'); notify(editing ? 'Card updated.' : 'Card created.')
  }
  function editCard(card) {
    setForm({ ...card }); setEditing(card.id); setPage('create')
  }
  async function removeCard(id) {
    if (!confirm('Delete this flashcard?')) return
    await deleteCard(id); await refresh(); notify('Card deleted.')
  }
  function imageUpload(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateForm('image', reader.result)
    reader.readAsDataURL(file)
  }
  function addLabel() {
    if (!labelName.trim() || !labelPoint) return notify('Tap the image to choose a point, then enter a label.')
    updateForm('labels', [...form.labels, { name: labelName.trim(), x: labelPoint.x, y: labelPoint.y }])
    setLabelName(''); setLabelPoint(null)
  }
  async function rateCard(rating) {
    const card = session[index]
    if (!card) return
    const intervals = { Again: 1, Hard: 1, Good: 3, Easy: 7 }
    const interval = rating === 'Again' ? 0 : Math.max(1, (card.interval || 0) ? Math.round((card.interval || 1) * (rating === 'Hard' ? 1.2 : rating === 'Good' ? 2.5 : 4)) : intervals[rating])
    const updated = {
      ...card, reviews: (card.reviews || 0) + 1,
      correct: (card.correct || 0) + (rating === 'Good' || rating === 'Easy' ? 1 : 0),
      interval, dueAt: Date.now() + interval * 86400000,
      mastered: rating === 'Easy' || (rating === 'Good' && (card.reviews || 0) >= 2)
    }
    await saveCard(updated); await refresh()
    setReviewed(v => v + 1); setRatings(v => ({ ...v, [rating]: v[rating] + 1 }))
    setIndex(v => v + 1); setRevealed(false); setAnswerText('')
  }

  const dueCount = cards.filter(c => !c.dueAt || c.dueAt <= Date.now()).length
  const mastered = cards.filter(c => c.mastered).length
  const accuracy = cards.reduce((n, c) => n + (c.reviews || 0), 0)
    ? Math.round(cards.reduce((n, c) => n + (c.correct || 0), 0) / cards.reduce((n, c) => n + (c.reviews || 0), 0) * 100) : 0
  const subjects = ['Geography', 'Biology', 'History', 'Other']
  const filtered = useMemo(() => cards.filter(c =>
    (filter === 'All' || c.subject === filter) &&
    `${c.front} ${c.back} ${c.tags}`.toLowerCase().includes(search.toLowerCase())
  ), [cards, filter, search])
  const current = session[index]

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">S</div><span>StudySpace</span></div>
      <span className="top-caption">YOUR LEARNING SPACE</span>
    </header>

    <main className="main">
      {page === 'home' && <section>
        <p className="eyebrow">{today()}</p>
        <h1>Good to see you.</h1>
        <div className="hero">
          <div className="hero-top"><span>DAILY REVISION</span><span className="soft-pill">{dueCount} due</span></div>
          <div className="hero-number">{dueCount} <small>cards ready</small></div>
          <p>Keep your knowledge fresh with a short review session.</p>
          <button className="primary full" onClick={() => navigate('study')}>Start studying <ChevronRight size={17}/></button>
        </div>
        <div className="stat-grid">
          <Stat label="Total cards" value={cards.length} icon={<Layers/>}/>
          <Stat label="Mastered" value={mastered} icon={<Sparkles/>}/>
        </div>
        <div className="section-heading"><h2>Your subjects</h2><button className="text-button" onClick={() => navigate('library')}>View library</button></div>
        <div className="subject-list">{subjects.filter(s => cards.some(c => c.subject === s)).map((s, i) =>
          <button className="subject-row" key={s} onClick={() => { setFilter(s); navigate('library') }}>
            <div className="subject-icon">{['🌍','🧬','📚','🗂️'][i]}</div>
            <div className="subject-info"><b>{s}</b><small>{cards.filter(c => c.subject === s).length} cards</small></div>
            <ChevronRight size={18}/>
          </button>)}</div>
        <button className="outline full add-shortcut" onClick={() => navigate('create')}><Plus size={17}/> Create a flashcard</button>
      </section>}

      {page === 'library' && <section>
        <p className="eyebrow">YOUR COLLECTION</p><h1>My library</h1><p className="muted">Organise and manage your study cards.</p>
        <div className="search-wrap"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." /></div>
        <div className="filter-row">{['All', ...subjects].map(s => <button key={s} className={`filter ${filter === s ? 'selected' : ''}`} onClick={() => setFilter(s)}>{s}</button>)}</div>
        <div className="section-heading"><h2>Flashcards</h2><span className="muted small">{filtered.length} cards</span></div>
        {filtered.length === 0 ? <Empty title="No cards found" text="Try another search or create your first flashcard."/> :
          <div className="card-list">{filtered.map(c => <div className="library-card" key={c.id}>
            <div className="card-type-icon">{c.image ? <ImagePlus size={19}/> : <BookOpen size={19}/>}</div>
            <button className="card-main" onClick={() => editCard(c)}><b>{c.front}</b><small>{c.subject} · {c.type} {c.mastered ? '· Mastered' : ''}</small></button>
            <button className="icon-button danger" aria-label="Delete card" onClick={() => removeCard(c.id)}><Trash2 size={16}/></button>
          </div>)}</div>}
        <button className="primary full add-shortcut" onClick={() => navigate('create')}><Plus size={17}/> New flashcard</button>
      </section>}

      {page === 'create' && <section>
        <button className="back-button" onClick={() => setPage('library')}><ArrowLeft size={17}/> Back to library</button>
        <p className="eyebrow">{editing ? 'EDIT YOUR CARD' : 'BUILD YOUR KNOWLEDGE'}</p><h1>{editing ? 'Edit card' : 'Create a card'}</h1>
        <form onSubmit={saveCurrent}>
          <label>Card type</label>
          <div className="type-grid">{['Basic','Definition','Image','Image labels'].map(t => <button type="button" key={t} className={`type-option ${form.type === t ? 'chosen' : ''}`} onClick={() => updateForm('type', t)}>{t}</button>)}</div>
          <div className="field"><label>Subject</label><select value={form.subject} onChange={e => updateForm('subject', e.target.value)}>{subjects.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label>{form.type === 'Definition' ? 'Term' : 'Question / prompt'}</label><textarea rows="2" value={form.front} onChange={e => updateForm('front', e.target.value)} placeholder={form.type === 'Definition' ? 'e.g. Plucking' : 'Write a question...'}/></div>
          {(form.type === 'Image' || form.type === 'Image labels') && <div className="field">
            <label>Image</label>
            <label className="upload-box"><ImagePlus size={24}/><b>{form.image ? 'Change image' : 'Choose an image'}</b><small>PNG, JPG or WEBP</small><input type="file" accept="image/*" onChange={e => imageUpload(e.target.files?.[0])}/></label>
            {form.image && <div className="label-image-wrap">
              <img src={form.image} alt="Card upload"/>
              {form.type === 'Image labels' && <div className="image-marker-layer" onClick={e => { const r=e.currentTarget.getBoundingClientRect(); setLabelPoint({x:Math.round((e.clientX-r.left)/r.width*100),y:Math.round((e.clientY-r.top)/r.height*100)}) }}>
                {form.labels.map((l,i) => <span key={i} className="marker" style={{left:`${l.x}%`,top:`${l.y}%`}}>{i+1}</span>)}
                {labelPoint && <span className="marker pending" style={{left:`${labelPoint.x}%`,top:`${labelPoint.y}%`}}>+</span>}
              </div>}
            </div>}
          </div>}
          {form.type === 'Image labels' && form.image && <div className="field">
            <label>Add image labels</label><p className="muted small">Tap a position on the image, enter its label, then add it.</p>
            <div className="inline-form"><input value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="Label name"/><button type="button" className="primary" onClick={addLabel}>Add</button></div>
            {form.labels.map((l,i) => <div className="label-row" key={i}><span className="soft-pill">{i+1}</span>{l.name}<button type="button" onClick={() => updateForm('labels', form.labels.filter((_,n)=>n!==i))}><X size={16}/></button></div>)}
          </div>}
          {form.type !== 'Image labels' && <div className="field"><label>{form.type === 'Definition' ? 'Definition' : 'Answer'}</label><textarea rows="4" value={form.back} onChange={e => updateForm('back', e.target.value)} placeholder="Write the answer..."/></div>}
          {form.type === 'Image labels' && <div className="field"><label>Answer / explanation (optional)</label><textarea rows="3" value={form.back} onChange={e => updateForm('back', e.target.value)} placeholder="Add any extra explanation..."/></div>}
          <div className="field"><label>Tags (optional)</label><input value={form.tags} onChange={e => updateForm('tags', e.target.value)} placeholder="e.g. exam, glaciation"/></div>
          <button className="primary full" type="submit"><Check size={17}/>{editing ? 'Save changes' : 'Save flashcard'}</button>
        </form>
      </section>}

      {page === 'study' && <section>
        <div className="study-top"><button className="back-button" onClick={() => setPage('home')}><X size={17}/> Exit</button><span className="muted small">{Math.min(index+1, session.length)} / {session.length}</span></div>
        <div className="progress-track"><div style={{width: `${session.length ? index/session.length*100 : 100}%`}}/></div>
        {!current ? <div className="complete-state"><div className="complete-icon"><Check size={30}/></div><h2>Session complete!</h2><p className="muted">You've finished the cards in this session.</p><button className="primary full" onClick={() => setPage('home')}>Back to dashboard</button></div> :
          <><div className="study-meta"><span className="soft-pill">{current.subject}</span><span className="muted small">{current.type}</span></div>
            <div className="study-card">
              <p className="eyebrow">{current.type === 'Definition' ? 'TERM' : current.type === 'Image labels' ? 'IMAGE LABELS' : 'QUESTION'}</p>
              <h2>{current.front}</h2>
              {current.image && <div className="study-image"><img src={current.image} alt="Flashcard"/></div>}
              {current.type === 'Image labels' && current.labels?.length > 0 && <div className="answer-labels">{current.labels.map((l,i)=><span key={i}>{i+1}. {l.name}</span>)}</div>}
              {revealed && <div className="answer-panel"><p className="eyebrow">ANSWER</p><p>{current.back || (current.labels || []).map(l=>l.name).join(', ')}</p></div>}
            </div>
            {!revealed ? <><p className="hint">Try to remember before revealing the answer.</p><button className="primary full" onClick={() => setRevealed(true)}>Reveal answer</button></> :
              <><p className="rate-prompt">How well did you remember?</p><div className="rating-grid">{[['Again','1 min'],['Hard','1 day'],['Good','3 days'],['Easy','7 days']].map(([r,t])=><button key={r} className={`rating rating-${r.toLowerCase()}`} onClick={() => rateCard(r)}><b>{r}</b><small>{t}</small></button>)}</div></>}
          </>}
      </section>}

      {page === 'stats' && <section>
        <p className="eyebrow">YOUR LEARNING</p><h1>Statistics</h1><p className="muted">A snapshot of your revision progress.</p>
        <div className="stat-grid stats-grid"><Stat label="Cards reviewed" value={cards.reduce((n,c)=>n+(c.reviews||0),0)} icon={<RotateCcw/>}/><Stat label="Mastered" value={mastered} icon={<Sparkles/>}/><Stat label="Accuracy" value={`${accuracy}%`} icon={<Check/>}/><Stat label="Total cards" value={cards.length} icon={<Layers/>}/></div>
        <div className="section-heading"><h2>Review ratings</h2></div>
        <div className="panel-box">{Object.entries(ratings).map(([name,value])=><div className="rating-stat" key={name}><div><span>{name}</span><b>{value}</b></div><div className="progress-track"><div style={{width:`${reviewed ? value/reviewed*100 : 0}%`}}/></div></div>)}</div>
        <div className="section-heading"><h2>By subject</h2></div>
        <div className="panel-box">{subjects.map(s=><div className="subject-stat" key={s}><span>{s}</span><b>{cards.filter(c=>c.subject===s).length} cards</b></div>)}</div>
        <p className="muted tiny">Revision history is stored on this device. Cloud synchronisation can be added later.</p>
      </section>}
    </main>

    <nav className="bottom-nav">
      <NavItem active={page==='home'} label="Home" icon={<Home/>} onClick={()=>navigate('home')}/>
      <NavItem active={page==='library'} label="Library" icon={<Library/>} onClick={()=>navigate('library')}/>
      <NavItem active={page==='create'} label="Create" icon={<Plus/>} onClick={()=>navigate('create')}/>
      <NavItem active={page==='study'} label="Study" icon={<Brain/>} onClick={()=>navigate('study')}/>
      <NavItem active={page==='stats'} label="Stats" icon={<ChartNoAxesColumn/>} onClick={()=>navigate('stats')}/>
    </nav>
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Stat({label,value,icon}) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
}
function NavItem({active,label,icon,onClick}) {
  return <button className={`nav-item ${active?'active':''}`} onClick={onClick}>{icon}<span>{label}</span></button>
}
function Empty({title,text}) { return <div className="empty"><Layers size={28}/><b>{title}</b><p>{text}</p></div> }

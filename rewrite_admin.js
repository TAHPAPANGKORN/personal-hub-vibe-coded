const fs = require('fs');

let fileStr = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Add active tab type
fileStr = fileStr.replace(
  `"gear" | "categories" | "games"`,
  `"gear" | "categories" | "games" | "pc_specs"`
);

// 2. Add Data states
fileStr = fileStr.replace(
  `const [gamesList, setGamesList] = useState<any[]>([]);`,
  `const [gamesList, setGamesList] = useState<any[]>([]);\n  const [pcSpecs, setPcSpecs] = useState<any[]>([]);`
);

// 3. Add Form States
const formStatesInjection = `
  // PC SPECS FORM STATES
  const [editingPcId, setEditingPcId] = useState<string | null>(null);
  const [pcType, setPcType] = useState("");
  const [pcName, setPcName] = useState("");
  const [pcBrand, setPcBrand] = useState("");
  const [pcDetails, setPcDetails] = useState("");
  const [pcImageUrl, setPcImageUrl] = useState("");
  const [pcImageFile, setPcImageFile] = useState<File | null>(null);
  const [submittingPc, setSubmittingPc] = useState(false);
  const [pcMessage, setPcMessage] = useState("");
`;
fileStr = fileStr.replace(
  `  useEffect(() => {`,
  formStatesInjection + `\n  useEffect(() => {`
);

// 4. Update Fetch
fileStr = fileStr.replace(
  `const { data: gameData } = await supabase`,
  `const { data: pcData } = await supabase.from("pc_specs").select("*").order("sort_order", { ascending: true });\n\n    const { data: gameData } = await supabase`
);
fileStr = fileStr.replace(
  `setGamesList(gameData || []);`,
  `setGamesList(gameData || []);\n    setPcSpecs(pcData || []);`
);

// 5. Handlers
const pcHandlers = `
  // --- PC SPECS LOGIC ---
  const resetPcForm = () => {
    setEditingPcId(null);
    setPcType("");
    setPcName("");
    setPcBrand("");
    setPcDetails("");
    setPcImageUrl("");
    setPcImageFile(null);
    setPcMessage("");
  };

  const handleEditPc = (pc: any) => {
    setEditingPcId(pc.id);
    setPcType(pc.component_type);
    setPcName(pc.name);
    setPcBrand(pc.brand || "");
    setPcDetails(pc.specs_detail || "");
    setPcImageUrl(pc.image_url || "");
    setPcImageFile(null);
    setPcMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePc = async (id: string, name: string) => {
    if (!confirm(\`Are you sure you want to delete \${name}?\`)) return;
    const { error } = await supabase.from("pc_specs").delete().eq("id", id);
    if (!error) {
      fetchData();
      if (editingPcId === id) resetPcForm();
    }
  };

  const handleAddPc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPc(true);
    setPcMessage("");

    let finalImageUrl = pcImageUrl;

    if (pcImageFile) {
      const fileExt = pcImageFile.name.split('.').pop();
      const fileName = \`pc_\${Math.random()}.\${fileExt}\`;
      const { error: uploadError } = await supabase.storage.from('gear_images').upload(fileName, pcImageFile);

      if (uploadError) {
        setPcMessage(\`Error uploading image: \${uploadError.message}\`);
        setSubmittingPc(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gear_images').getPublicUrl(fileName);
      finalImageUrl = publicUrl;
    }

    const payload: any = {
      component_type: pcType,
      name: pcName,
      brand: pcBrand,
      specs_detail: pcDetails,
      image_url: finalImageUrl || null,
    };

    let error;
    if (editingPcId) {
      const { error: updateErr } = await supabase.from("pc_specs").update(payload).eq("id", editingPcId);
      error = updateErr;
    } else {
      payload.sort_order = pcSpecs.length;
      const { error: insertErr } = await supabase.from("pc_specs").insert([payload]);
      error = insertErr;
    }

    if (error) {
      setPcMessage(\`Error: \${error.message}\`);
    } else {
      setPcMessage(editingPcId ? "PC Part updated successfully!" : "PC Part added successfully!");
      resetPcForm();
      fetchData();
      setTimeout(() => setPcMessage(""), 3000);
    }
    setSubmittingPc(false);
  };

  const handleOnDragEndPc = async (result: DropResult) => {
    if (!result.destination) return;
    
    const elements = Array.from(pcSpecs);
    const [reorderedItem] = elements.splice(result.source.index, 1);
    elements.splice(result.destination.index, 0, reorderedItem);

    setPcSpecs(elements);

    const updates = elements.map((el, idx) => 
      supabase.from("pc_specs").update({ sort_order: idx }).eq("id", el.id)
    );
    await Promise.all(updates);
  };

`;

fileStr = fileStr.replace(
  `// --- DRAG AND DROP HANDLERS ---`,
  pcHandlers + `\n  // --- DRAG AND DROP HANDLERS ---`
);

// 6. TABS RENDERING
const tabInjection = `
        <button 
          onClick={() => setActiveTab("pc_specs")}
          className={\`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap \${activeTab === 'pc_specs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-white'}\`}
        >
          Manage PC Build
        </button>
      </div>`;

fileStr = fileStr.replace(
  `      </div>\n\n      {activeTab === "gear" && (`,
  tabInjection + `\n\n      {activeTab === "gear" && (`
);

// 7. PC SPECS TAB
const pcTabMarkup = `
      {activeTab === "pc_specs" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleAddPc} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            {editingPcId && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDIT MODE</div>
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">
                {editingPcId ? \`Editing: \${pcName}\` : "Add PC Component"}
              </h2>
              {editingPcId && (
                <button type="button" onClick={resetPcForm} className="text-xs text-zinc-400 hover:text-white underline">Cancel Edit</button>
              )}
            </div>
            
            {pcMessage && (
              <div className={\`p-3 rounded-lg text-sm \${pcMessage.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}\`}>
                {pcMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Component Type (CPU, GPU, RAM...)</label>
                <input type="text" placeholder="e.g. GPU" value={pcType} onChange={(e) => setPcType(e.target.value)} required className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name (Model)</label>
                <input type="text" placeholder="e.g. RTX 4090" value={pcName} onChange={(e) => setPcName(e.target.value)} required className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand (Optional)</label>
                <input type="text" placeholder="e.g. ASUS ROG" value={pcBrand} onChange={(e) => setPcBrand(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Specs Detail (Optional)</label>
                <input type="text" placeholder="e.g. 24GB GDDR6X" value={pcDetails} onChange={(e) => setPcDetails(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              
              <div className="md:col-span-2 space-y-4 bg-black/20 p-5 rounded-xl border border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <ImageIcon size={16} /> Component Image (Optional)
                </h3>
                {(pcImageFile || pcImageUrl) && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl mb-4">
                    <div className="relative h-16 w-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      <img src={pcImageFile ? URL.createObjectURL(pcImageFile) : pcImageUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={(e) => { if(e.target.files && e.target.files.length > 0) { setPcImageFile(e.target.files[0]); setPcImageUrl(""); } }} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">OR Paste URL</label>
                  <input type="url" placeholder="https://..." value={pcImageUrl} onChange={(e) => { setPcImageUrl(e.target.value); setPcImageFile(null); }} disabled={!!pcImageFile} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-white disabled:opacity-30 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submittingPc} className={\`w-full md:w-auto rounded-lg px-8 py-3 font-semibold transition-colors focus:ring-2 disabled:opacity-50 \${editingPcId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white hover:bg-zinc-200 text-black'}\`}>
              {submittingPc ? 'Saving...' : editingPcId ? 'Update Component' : 'Add Component'}
            </button>
          </form>

          {/* PC LIST */}
           <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-white">My PC Specs</h2>
              <span className="text-xs text-zinc-500 italic hidden md:block">Drag to reorder</span>
            </div>
            
            {fetchingData ? (
              <div className="text-zinc-500 text-center py-8">Loading items...</div>
            ) : pcSpecs.length === 0 ? (
              <div className="text-zinc-500 text-center py-8 bg-zinc-900 border border-zinc-800 rounded-2xl">No components found.</div>
            ) : (
                <DragDropContext onDragEnd={handleOnDragEndPc}>
                  <Droppable droppableId="pc-items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-4">
                        {pcSpecs.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="cursor-grab text-zinc-600 hover:text-white mr-2 active:cursor-grabbing">
                                    <GripVertical size={20} />
                                  </div>
                                  <div className="h-16 w-16 shrink-0 bg-white/5 p-2 rounded-lg border border-zinc-800 relative flex items-center justify-center">
                                    {item.image_url ? (
                                      <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="64px" />
                                    ) : (
                                      <span className="text-xs text-zinc-500 font-bold">{item.component_type}</span>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    <h3 className="text-white font-bold">{item.name}</h3>
                                    <div className="flex gap-2 items-center text-xs text-zinc-400 mt-1">
                                      <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">{item.component_type}</span>
                                      {item.specs_detail && <span>• {item.specs_detail}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditPc(item)} className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 rounded-lg"><Pencil size={14} /></button>
                                  <button onClick={() => handleDeletePc(item.id, item.name)} className="p-2 text-red-400 bg-red-950/30 hover:bg-red-900/50 rounded-lg"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
            )}
          </div>
        </div>
      )}
`;

fileStr = fileStr.replace(
  `    </div>\n  );\n}`,
  pcTabMarkup + `\n    </div>\n  );\n}`
);

fs.writeFileSync('src/app/admin/page.tsx', fileStr);

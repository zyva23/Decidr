
import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateDecisionTree } from '../services/geminiService';
import { DecisionTree, CouncilResult } from '../types';

interface DecisionTreeVizProps {
  problemTitle: string;
  councilResult?: CouncilResult;
  initialTree?: DecisionTree;
  onSave: (tree: DecisionTree) => void;
  onClose: () => void;
}

const DecisionTreeViz: React.FC<DecisionTreeVizProps> = ({ problemTitle, councilResult, initialTree, onSave, onClose }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSentiment, setEditSentiment] = useState<'positive' | 'negative' | 'neutral'>('neutral');

  const getNodeStyle = (sentiment?: string) => {
    const base = {
      color: '#f8fafc',
      borderRadius: '12px',
      padding: '10px',
      fontSize: '11px',
      width: 200,
      transition: 'all 0.3s ease'
    };
    if (sentiment === 'positive') return { ...base, background: '#064e3b', border: '2px solid #10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' };
    if (sentiment === 'negative') return { ...base, background: '#450a0a', border: '2px solid #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' };
    return { ...base, background: '#1e293b', border: '1px solid #6366f1' };
  };

  const getEdgeStyle = (sourceSentiment?: string, targetSentiment?: string) => {
    if (sourceSentiment === 'positive' && targetSentiment === 'positive') return { stroke: '#10b981', strokeWidth: 2 };
    if (targetSentiment === 'negative') return { stroke: '#ef4444', strokeWidth: 2 };
    return { stroke: '#6366f1' };
  };

  const formatNodesAndEdges = (tree: DecisionTree) => {
    const nodeMap = new Map(tree.nodes.map(n => [n.id, n]));
    
    const formattedNodes: Node[] = tree.nodes.map(node => ({
      ...node,
      style: getNodeStyle(node.data.sentiment)
    }));

    const formattedEdges: Edge[] = tree.edges.map(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      return {
        ...edge,
        animated: target?.data.sentiment === 'positive' || target?.data.sentiment === 'negative',
        style: getEdgeStyle(source?.data.sentiment, target?.data.sentiment),
        labelStyle: { fill: '#818cf8', fontWeight: 700, fontSize: '10px' }
      };
    });

    return { nodes: formattedNodes, edges: formattedEdges };
  };

  useEffect(() => {
    if (initialTree && initialTree.nodes.length > 0) {
      const { nodes: fn, edges: fe } = formatNodesAndEdges(initialTree);
      setNodes(fn);
      setEdges(fe);
    }
  }, [initialTree]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    []
  );

  const handleGenerateTree = async () => {
    setIsLoading(true);
    try {
      const data = await generateDecisionTree(problemTitle, councilResult);
      const { nodes: fn, edges: fe } = formatNodesAndEdges(data);
      setNodes(fn);
      setEdges(fe);
    } catch (error) {
      console.error("Failed to generate tree:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const treeData: DecisionTree = {
      nodes: nodes.map(n => ({ id: n.id, position: n.position, data: n.data as any })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label as string }))
    };
    onSave(treeData);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setEditLabel((node.data as any).label);
    setEditSentiment((node.data as any).sentiment || 'neutral');
  };

  const updateNodeLabel = () => {
    if (!selectedNodeId) return;
    setNodes(nds => {
      const newNodes = nds.map(n => n.id === selectedNodeId ? { 
        ...n, 
        data: { ...n.data, label: editLabel, sentiment: editSentiment },
        style: getNodeStyle(editSentiment)
      } : n);
      
      // Also update edge styles when a node's sentiment changes
      setTimeout(() => {
        setEdges(eds => eds.map(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          return {
            ...edge,
            animated: target?.data.sentiment === 'positive' || target?.data.sentiment === 'negative',
            style: getEdgeStyle(source?.data.sentiment as any, target?.data.sentiment as any)
          };
        }));
      }, 0);
      
      return newNodes;
    });
    setSelectedNodeId(null);
  };

  const addNewNode = () => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      position: { x: 250, y: 250 },
      data: { label: 'New Scenario Node', sentiment: 'neutral' },
      style: getNodeStyle('neutral')
    };
    setNodes(nds => [...nds, newNode]);
  };

  const deleteSelected = () => {
    if (selectedNodeId) {
      setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
      setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-slate-950">
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>
           </div>
           <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Causal Scenario Mapping</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span className="text-emerald-400">Green = Council Path</span> • <span className="text-red-400">Red = Undesirable</span>
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/40">Save & Close</button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </header>

      <main className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          colorMode="dark"
        >
          <Background color="#1e293b" gap={20} />
          <Controls />
          
          <Panel position="top-left" className="flex flex-col gap-2">
            <button
              onClick={handleGenerateTree}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all"
            >
              {isLoading ? 'Deliberating...' : 'AI Re-Generate'}
            </button>
            <button
              onClick={addNewNode}
              className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all"
            >
              + Add Scenario Node
            </button>
          </Panel>

          {selectedNodeId && (
            <Panel position="top-right" className="bg-slate-900 border border-slate-700 p-4 rounded-xl w-64 shadow-2xl animate-fade-in">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Edit Scenario Node</h4>
              <textarea 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white mb-3 outline-none focus:border-indigo-500"
              />
              <div className="mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Sentiment</label>
                <div className="flex gap-1">
                  {(['positive', 'neutral', 'negative'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditSentiment(s)}
                      className={`flex-1 py-1 text-[9px] font-black uppercase rounded border transition-all ${
                        editSentiment === s 
                          ? (s === 'positive' ? 'bg-emerald-600 border-emerald-400 text-white' : s === 'negative' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-700 border-slate-500 text-white')
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={updateNodeLabel} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Apply</button>
                <button onClick={deleteSelected} className="px-3 py-2 bg-red-900/50 text-red-400 border border-red-500/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
              </div>
            </Panel>
          )}

          <Panel position="bottom-center" className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Tip: Drag nodes to rearrange • Connect handles to map causal links • Click node to edit
          </Panel>
        </ReactFlow>
      </main>
    </div>
  );
};

export default DecisionTreeViz;

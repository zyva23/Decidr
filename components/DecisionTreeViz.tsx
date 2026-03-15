
import React, { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateDecisionTree } from '../services/geminiService';

interface DecisionTreeVizProps {
  problemTitle: string;
}

const DecisionTreeViz: React.FC<DecisionTreeVizProps> = ({ problemTitle }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleGenerateTree = async () => {
    setIsLoading(true);
    try {
      const data = await generateDecisionTree(problemTitle);
      
      // Transform incoming data to ensure compatible types for ReactFlow
      const formattedNodes: Node[] = data.nodes.map(node => ({
        ...node,
        type: 'default',
        style: { 
          background: '#1e293b', 
          color: '#f8fafc', 
          border: '1px solid #6366f1',
          borderRadius: '12px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
          width: 180,
          textAlign: 'center' as const
        }
      }));

      const formattedEdges: Edge[] = data.edges.map(edge => ({
        ...edge,
        animated: true,
        style: { stroke: '#6366f1' },
        labelStyle: { fill: '#818cf8', fontWeight: 700, fontSize: '10px' }
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (error) {
      console.error("Failed to generate decision tree:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[600px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col relative group">
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
        <button
          onClick={handleGenerateTree}
          disabled={isLoading || !problemTitle}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Mapping Possibilities...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 4-1 4 11 4-11 4 1 3-9"/><path d="M12 21v-2"/><path d="M12 13V5"/></svg>
              Generate Scenarios
            </>
          )}
        </button>
        {nodes.length > 0 && (
           <div className="px-4 py-2 bg-slate-950/50 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-fade-in">
              Multi-Level Causal Mapping Active
           </div>
        )}
      </div>

      {!nodes.length && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>
          </div>
          <h4 className="text-xl font-bold text-white mb-2">Scenario Probabilities</h4>
          <p className="text-slate-500 max-w-sm text-sm">Visualize cascading outcomes and divergent futures for this specific inquiry.</p>
        </div>
      )}

      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          colorMode="dark"
        >
          <Background color="#334155" gap={20} />
          <Controls className="bg-slate-800 border-slate-700 fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DecisionTreeViz;

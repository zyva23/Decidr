import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Circle, Path } from '@react-pdf/renderer';
import { CouncilResult, DecisionInput, ActionPlan } from '../types';

// Data structure expected by the integrated template
export interface ReportData {
  title: string;
  agents: {
    skeptic: string;
    mediator: string;
    analyst: string;
    strategist: string;
  };
  agentNames: {
    skeptic: string;
    mediator: string;
    analyst: string;
    strategist: string;
  };
  actionPlan?: ActionPlan;
  verdict: string;
  recommendation: string;
  radarImage?: string;
}

const styles = StyleSheet.create({
  // --- COVER PAGE STYLES ---
  coverPage: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    height: '100%',
    position: 'relative',
    padding: 60,
  },
  coverAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
    backgroundColor: '#6366F1',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#6366F1',
    fontFamily: 'Helvetica-Bold',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 1.1,
    fontFamily: 'Helvetica-Bold',
  },
  coverDivider: {
    width: 80,
    height: 4,
    backgroundColor: '#6366F1',
    marginBottom: 30,
  },
  coverDate: {
    position: 'absolute',
    bottom: 60,
    right: 60,
    fontSize: 12,
    color: '#64748B',
  },
  // --- CONTENT PAGE STYLES ---
  page: {
    padding: 50,
    paddingTop: 60,
    paddingBottom: 80,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
    position: 'relative',
  },
  pageTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#6366F1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 25,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  archetypeLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: 12,
  },
  agentBox: {
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderLeft: 4,
    borderLeftColor: '#CBD5E1',
    marginBottom: 20,
    position: 'relative',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  mediatorBorder: { borderLeftColor: '#10B981' },
  skepticBorder: { borderLeftColor: '#EF4444' },
  analystBorder: { borderLeftColor: '#3B82F6' },
  strategistBorder: { borderLeftColor: '#A855F7' },
  
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 15,
    fontWeight: 'bold',
    color: '#6366F1',
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  radarContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  radarImage: {
    width: 320,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  // --- ROADMAP SPECIFIC STYLES ---
  phaseBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    border: 1,
    borderColor: '#E2E8F0',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 5,
  },
  phaseTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'Helvetica-Bold',
  },
  phaseDuration: {
    fontSize: 9,
    color: '#64748B',
    fontStyle: 'italic',
  },
  phaseObjective: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  errorTag: {
    fontSize: 7,
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '2 6',
    borderRadius: 4,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  successTag: {
    fontSize: 7,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    padding: '2 6',
    borderRadius: 4,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  }
});

// --- AGENT AVATARS ---
const AnalystAvatar = () => (
  <Svg viewBox="0 0 100 100" style={styles.avatarContainer}>
    <Circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
    <Path d="M30 70 L45 50 L60 60 L75 30" stroke="#60a5fa" strokeWidth="4" fill="none" />
  </Svg>
);

const StrategistAvatar = () => (
  <Svg viewBox="0 0 100 100" style={styles.avatarContainer}>
    <Circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
    <Path d="M40 70 L60 70 L50 25 Z" fill="#c084fc" opacity={0.8} />
  </Svg>
);

const SkepticAvatar = () => (
  <Svg viewBox="0 0 100 100" style={styles.avatarContainer}>
    <Circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
    <Path d="M50 25 C30 25 25 40 25 50 C25 75 50 85 50 85 C50 85 75 75 75 50 C75 40 70 25 50 25 Z" fill="none" stroke="#f87171" strokeWidth="4" />
  </Svg>
);

const MediatorAvatar = () => (
  <Svg viewBox="0 0 100 100" style={styles.avatarContainer}>
    <Circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
    <Circle cx="35" cy="55" r="7" fill="#6ee7b7" />
    <Circle cx="65" cy="55" r="7" fill="#6ee7b7" />
    <Circle cx="50" cy="35" r="7" fill="#6ee7b7" />
  </Svg>
);

const CoverBackgroundGraphics = () => (
  <Svg style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400 }}>
    <Circle cx="400" cy="0" r="200" fill="#1E293B" fillOpacity={0.5} />
    <Circle cx="400" cy="0" r="150" fill="#334155" fillOpacity={0.3} />
    <Circle cx="350" cy="50" r="10" fill="#6366F1" fillOpacity={0.4} />
  </Svg>
);

export const DecisionPDF = ({ input, result, actionPlan, radarImage }: { 
  input: DecisionInput, 
  result: CouncilResult, 
  actionPlan?: ActionPlan, 
  radarImage?: string 
}) => {
  const data: ReportData = {
    title: input.title,
    verdict: result.synthesis.verdict,
    recommendation: result.synthesis.recommendation,
    agents: {
      skeptic: result.skeptic.analysis,
      mediator: result.mediator.analysis,
      analyst: result.analyst.analysis,
      strategist: result.strategist.analysis,
    },
    agentNames: {
      skeptic: result.skeptic.name,
      mediator: result.mediator.name,
      analyst: result.analyst.name,
      strategist: result.strategist.name,
    },
    actionPlan,
    radarImage
  };

  return (
    <Document title={data.title}>
      {/* PAGE 1: THE EXECUTIVE COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverAccentBar} />
        <CoverBackgroundGraphics />
        
        <Text style={styles.logoText}>DECIDR.AI</Text>
        
        <View style={{ marginTop: 100 }}>
          <Text style={styles.coverSubtitle}>Strategic Decision Briefing</Text>
          <Text style={styles.coverTitle}>{data.title.toUpperCase()}</Text>
          <View style={styles.coverDivider} />
          <Text style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 400 }}>
            A multi-agent synthesis evaluating logical, strategic, and risk-adjusted pathways.
          </Text>
        </View>
        
        <Text style={styles.coverDate}>Generated on {new Date().toLocaleDateString()}</Text>
      </Page>

      {/* PAGE 2+: THE REPORT CONTENT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageTopAccent} />
        
        {/* Verdict Section */}
        <Text style={styles.sectionTitle}>1. Executive Verdict</Text>
        <View style={[styles.agentBox, { borderLeftColor: '#6366F1' }]}>
          <Text style={[styles.subTitle, { color: '#4F46E5' }]}>Strategic Synthesis</Text>
          <Text style={[styles.bodyText, { fontWeight: 'bold', color: '#0F172A', fontFamily: 'Helvetica-Bold' }]}>{data.verdict}</Text>
          <Text style={styles.bodyText}>{data.recommendation}</Text>
        </View>

        {data.radarImage && (
          <View style={styles.radarContainer} wrap={false}>
            <Image src={data.radarImage} style={styles.radarImage} />
            <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 10 }}>Fig 1.1: Decision Vector Analysis</Text>
          </View>
        )}

        {/* Council Perspectives */}
        <Text style={styles.sectionTitle}>2. Council Perspectives</Text>
        
        <View style={[styles.agentBox, styles.analystBorder]} wrap={false}>
          <View style={styles.agentHeader}>
            <AnalystAvatar />
            <View>
              <Text style={styles.subTitle}>{data.agentNames.analyst}</Text>
              <Text style={styles.archetypeLabel}>The Rationalist</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{data.agents.analyst}</Text>
        </View>

        <View style={[styles.agentBox, styles.strategistBorder]} wrap={false}>
          <View style={styles.agentHeader}>
            <StrategistAvatar />
            <View>
              <Text style={styles.subTitle}>{data.agentNames.strategist}</Text>
              <Text style={styles.archetypeLabel}>The Architect</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{data.agents.strategist}</Text>
        </View>

        <View style={[styles.agentBox, styles.skepticBorder]} wrap={false}>
          <View style={styles.agentHeader}>
            <SkepticAvatar />
            <View>
              <Text style={styles.subTitle}>{data.agentNames.skeptic}</Text>
              <Text style={styles.archetypeLabel}>The Realist</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{data.agents.skeptic}</Text>
        </View>

        <View style={[styles.agentBox, styles.mediatorBorder]} wrap={false}>
          <View style={styles.agentHeader}>
            <MediatorAvatar />
            <View>
              <Text style={styles.subTitle}>{data.agentNames.mediator}</Text>
              <Text style={styles.archetypeLabel}>The Ethicist</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{data.agents.mediator}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Decidr Strategic Briefing: {data.title.substring(0, 40)}...</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber - 1} of ${totalPages - 1}`
          )} />
        </View>
      </Page>

      {/* ROADMAP PAGE(S) */}
      {data.actionPlan && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageTopAccent} />
          <Text style={styles.sectionTitle}>3. Execution Roadmap</Text>
          <Text style={[styles.bodyText, { marginBottom: 20 }]}>{data.actionPlan.executiveSummary}</Text>

          {data.actionPlan.phases.map((phase, idx) => (
            <View key={idx} style={styles.phaseBox} wrap={false}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseTitle}>PHASE {idx + 1}: {phase.name.toUpperCase()}</Text>
                <Text style={styles.phaseDuration}>{phase.duration}</Text>
              </View>
              
              <Text style={styles.phaseObjective}>Objective: {phase.objective}</Text>
              
              <View style={{ marginBottom: 10 }}>
                {phase.tasks.map((task, ti) => (
                  <View key={ti} style={styles.bulletPoint}>
                    <Text style={styles.bulletDot}>→</Text>
                    <Text style={styles.bulletText}>
                      <Text style={{ fontFamily: 'Helvetica-Bold' }}>{task.description}</Text>
                      {task.kpi && <Text style={{ color: '#6366F1' }}> (KPI: {task.kpi})</Text>}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.tagContainer}>
                {phase.pitfalls.map((p, pi) => (
                  <Text key={pi} style={styles.errorTag}>✕ {p}</Text>
                ))}
              </View>
              
              <View style={styles.tagContainer}>
                {phase.successCriteria.map((s, si) => (
                  <Text key={si} style={styles.successTag}>✓ {s}</Text>
                ))}
              </View>
            </View>
          ))}

          {/* Pivot Points */}
          {data.actionPlan.pivotPoints && data.actionPlan.pivotPoints.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>4. Strategic Pivot Points</Text>
              {data.actionPlan.pivotPoints.map((pivot, index) => (
                <View key={`pivot-${index}`} style={styles.bulletPoint} wrap={false}>
                  <Text style={styles.bulletDot}>↳</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bulletText, { fontFamily: 'Helvetica-Bold', color: '#B45309' }]}>IF: {pivot.trigger}</Text>
                    <Text style={styles.bulletText}>THEN: {pivot.reaction}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Decidr Strategic Briefing: {data.title.substring(0, 40)}...</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber - 1} of ${totalPages - 1}`
            )} />
          </View>
        </Page>
      )}
    </Document>
  );
};

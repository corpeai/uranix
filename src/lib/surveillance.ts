import { Connection, PublicKey } from '@solana/web3.js';
import { SurveillanceData, PrivacyScore } from '@/types';
import { connection } from './solana';
import { calculatePrivacyScore } from './utils';

/**
 * Surveillance Detection and Privacy Scoring
 * Analyzes wallet exposure to various tracking methods
 */

export class SurveillanceMonitor {
  private connection: Connection;

  constructor(customConnection?: Connection) {
    this.connection = customConnection || connection;
  }

  /**
   * Analyze wallet for surveillance exposure
   */
  async analyzeSurveillance(walletAddress: PublicKey): Promise<SurveillanceData> {
    try {
      // Get transaction history
      const signatures = await this.connection.getSignaturesForAddress(walletAddress, {
        limit: 100,
      });

      const totalTransactions = signatures.length;

      // Simulate privacy-protected transactions (in production, check Privacy Cash/ShadowPay)
      const protectedTransactions = 0; // Would query Privacy Cash and ShadowPay pools

      // Calculate exposure
      const exposedTransactions = totalTransactions - protectedTransactions;
      const exposureRatio = totalTransactions > 0 ? exposedTransactions / totalTransactions : 1;

      // Determine tracking risk
      let trackingRisk: 'low' | 'medium' | 'high';
      if (exposureRatio < 0.3) trackingRisk = 'low';
      else if (exposureRatio < 0.7) trackingRisk = 'medium';
      else trackingRisk = 'high';

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        exposedTransactions,
        protectedTransactions,
        trackingRisk
      );

      return {
        walletAddress: walletAddress.toBase58(),
        exposedTransactions,
        protectedTransactions,
        balanceExposed: protectedTransactions === 0, // Balance exposed if no privacy protection
        trackingRisk,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing surveillance:', error);
      return {
        walletAddress: walletAddress.toBase58(),
        exposedTransactions: 0,
        protectedTransactions: 0,
        balanceExposed: true,
        trackingRisk: 'high',
        recommendations: ['Unable to analyze wallet'],
      };
    }
  }

  /**
   * Calculate comprehensive privacy score
   */
  async calculatePrivacyScore(
    walletAddress: PublicKey,
    hasPrivateBalance: boolean = false,
    usesStealthMode: boolean = false
  ): Promise<PrivacyScore> {
    try {
      const surveillance = await this.analyzeSurveillance(walletAddress);

      const score = calculatePrivacyScore(
        surveillance.protectedTransactions,
        surveillance.exposedTransactions + surveillance.protectedTransactions,
        hasPrivateBalance,
        usesStealthMode
      );

      const exposedDataPoints = this.identifyExposedData(surveillance);
      const protectedDataPoints = this.identifyProtectedData(
        hasPrivateBalance,
        usesStealthMode,
        surveillance.protectedTransactions
      );

      return {
        score,
        exposedDataPoints,
        protectedDataPoints,
        recommendations: surveillance.recommendations,
      };
    } catch (error) {
      console.error('Error calculating privacy score:', error);
      return {
        score: 0,
        exposedDataPoints: ['Unable to calculate'],
        protectedDataPoints: [],
        recommendations: [],
      };
    }
  }

  /**
   * Generate privacy recommendations
   */
  private generateRecommendations(
    exposed: number,
    protectedCount: number,
    risk: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];

    if (risk === 'high') {
      recommendations.push('Immediately start using Privacy Cash to shield your balance');
      recommendations.push('Use Stealth Mode for all future transactions');
      recommendations.push('Consider creating a new wallet for sensitive operations');
    } else if (risk === 'medium') {
      recommendations.push('Increase usage of privacy-preserving transactions');
      recommendations.push('Shield more of your balance in privacy pools');
    } else {
      recommendations.push('Continue using privacy features regularly');
      recommendations.push('Monitor your privacy score monthly');
    }

    if (exposed > 50) {
      recommendations.push('Your transaction history is highly exposed to trackers');
    }

    if (protectedCount === 0) {
      recommendations.push('Start by depositing to Privacy Cash pool');
    }

    return recommendations;
  }

  /**
   * Identify exposed data points
   */
  private identifyExposedData(surveillance: SurveillanceData): string[] {
    const exposed: string[] = [];

    if (surveillance.balanceExposed) {
      exposed.push('Current wallet balance visible on block explorer');
    }

    if (surveillance.exposedTransactions > 0) {
      exposed.push(`${surveillance.exposedTransactions} public transactions visible`);
      exposed.push('Transaction amounts are publicly visible');
      exposed.push('Sender and recipient addresses are linked');
      exposed.push('Transaction timestamps are public');
    }

    if (surveillance.trackingRisk === 'high') {
      exposed.push('Wallet activity can be clustered and analyzed');
      exposed.push('Vulnerable to front-running attacks');
      exposed.push('Trading patterns are detectable');
    }

    return exposed;
  }

  /**
   * Identify protected data points
   */
  private identifyProtectedData(
    hasPrivateBalance: boolean,
    usesStealthMode: boolean,
    protectedTxCount: number
  ): string[] {
    const protectedData: string[] = [];

    if (hasPrivateBalance) {
      protectedData.push('Portion of balance hidden in privacy pool');
      protectedData.push('True holdings are obfuscated');
    }

    if (usesStealthMode) {
      protectedData.push('Stealth mode transfers hide sender identity');
      protectedData.push('Transaction amounts encrypted with Bulletproofs');
    }

    if (protectedTxCount > 0) {
      protectedData.push(`${protectedTxCount} transactions protected with ZK proofs`);
      protectedData.push('Deposit-withdrawal links are broken');
      protectedData.push('Anonymity set provides plausible deniability');
    }

    return protectedData;
  }
}

/**
 * Simulate what surveillance tools can see
 */
export const simulateTrackerView = async (
  walletAddress: PublicKey
): Promise<{
  visibleBalance: number;
  visibleTransactions: number;
  knownInteractions: string[];
  trackingCapabilities: string[];
}> => {
  try {
    const balance = await connection.getBalance(walletAddress);
    const signatures = await connection.getSignaturesForAddress(walletAddress, { limit: 10 });

    return {
      visibleBalance: balance,
      visibleTransactions: signatures.length,
      knownInteractions: [
        'All transaction partners visible',
        'Transaction amounts visible',
        'Timing patterns visible',
      ],
      trackingCapabilities: [
        'Wallet clustering (linking multiple addresses)',
        'Transaction graph analysis',
        'Balance tracking over time',
        'Front-running detection',
        'MEV extraction opportunities',
      ],
    };
  } catch (error) {
    console.error('Error simulating tracker view:', error);
    return {
      visibleBalance: 0,
      visibleTransactions: 0,
      knownInteractions: [],
      trackingCapabilities: [],
    };
  }
};

/**
 * Get privacy risk level description
 */
export const getPrivacyRiskDescription = (
  risk: 'low' | 'medium' | 'high'
): { title: string; description: string; color: string } => {
  switch (risk) {
    case 'low':
      return {
        title: 'Low Risk',
        description: 'Your privacy is well protected. Continue current practices.',
        color: 'text-green-500',
      };
    case 'medium':
      return {
        title: 'Medium Risk',
        description: 'Some exposure detected. Consider increasing privacy measures.',
        color: 'text-yellow-500',
      };
    case 'high':
      return {
        title: 'High Risk',
        description: 'Significant exposure detected. Immediate action recommended.',
        color: 'text-red-500',
      };
  }
};

// Export singleton
export const surveillanceMonitor = new SurveillanceMonitor();

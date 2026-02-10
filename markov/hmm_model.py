import numpy as np
from hmmlearn.hmm import GaussianHMM
import pandas as pd

class HMMRegimeModel:
    def __init__(self, n_components=2, n_iter=1000, random_state=42):
        self.n_components = n_components
        self.model = GaussianHMM(
            n_components=n_components, 
            covariance_type="full", 
            n_iter=n_iter,
            random_state=random_state,
            verbose=False
        )
        self.regime_map = {} # state_id -> 'Bull', 'Bear', 'Neutral', etc.
        self.colors = {}     # state_id -> 'green', 'orange', 'grey'

    def train(self, df):
        """
        Trains the HMM model on Returns and Volatility.
        Expects df to have 'Returns' and 'Volatility' columns.
        """
        X = df[['Returns', 'Volatility']].values
        self.model.fit(X)
        
        # Analyze states to determine regimes
        means = self.model.means_
        covars = self.model.covars_
        
        # Means shape: (n_components, n_features) -> 0: Returns, 1: Volatility
        # Covars shape: (n_components, n_features, n_features) (for 'full')
        
        # Extract mean returns and volatility (std dev matches sqrt of variance approx) for classification
        state_stats = []
        for i in range(self.n_components):
            mean_ret = means[i][0]
            vol_val = means[i][1] # This is the mean of the volatility feature
            state_stats.append({
                'id': i,
                'mean_return': mean_ret,
                'mean_volatility': vol_val
            })
            
        sorted_by_ret = sorted(state_stats, key=lambda x: x['mean_return'], reverse=True)
        sorted_by_vol = sorted(state_stats, key=lambda x: x['mean_volatility'], reverse=True)
        
        bull_state_id = sorted_by_ret[0]['id']
        crash_state_id = sorted_by_vol[0]['id']
        
        # Default assignment
        for stat in state_stats:
            sid = stat['id']
            if sid == bull_state_id:
                self.regime_map[sid] = "Bull"
                self.colors[sid] = "green"
            elif sid == crash_state_id:
                self.regime_map[sid] = "Crash Risk"
                self.colors[sid] = "orange"
            else:
                self.regime_map[sid] = "Neutral"
                self.colors[sid] = "grey"
        
        # Edge case for 2 states where Bull might also be High Vol (unlikely but possible)
        # Or if Bull != Crash, good.
        # If n_components=2 and we have defined both, we are good.
        
        # Return params for display
        return state_stats

    def predict(self, df):
        X = df[['Returns', 'Volatility']].values
        hidden_states = self.model.predict(X)
        posterior_probs = self.model.predict_proba(X)
        
        # Append to dataframe
        result = df.copy()
        result['State'] = hidden_states
        result['Regime'] = result['State'].map(self.regime_map)
        result['Color'] = result['State'].map(self.colors)
        
        # Probability of Bull Regime
        bull_state_ids = [k for k, v in self.regime_map.items() if v == 'Bull']
        if bull_state_ids:
             # Sum probs of all bull states (usually just one)
            result['Bull_Prob'] = np.sum(posterior_probs[:, bull_state_ids], axis=1)
        else:
            result['Bull_Prob'] = 0.0
            
        return result, posterior_probs

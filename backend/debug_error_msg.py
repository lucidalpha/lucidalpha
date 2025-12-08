
import pandas as pd
import numpy as np

def test_error():
    print("Testing error reproduction...")
    try:
        # Scenario 1: Series comparison
        s1 = pd.Series([1,2])
        s2 = pd.Series([2,1])
        # if s1 > s2: pass 
        # -> ValueError: The truth value of a Series is ambiguous.
        
        # Scenario 2: Index construction
        # pd.Index(1)
        # -> TypeError: Index(...) must be called with a collection of some kind, 1 was passed
        
        # Scenario 3: DataFrame construction
        # pd.DataFrame(1)
        # -> ValueError: DataFrame constructor not properly called!
        
        # Scenario 4: "arg must be a list, tuple, 1-d array, or Series"
        # This message comes from pandas.core.common.is_list_like or similar checks?
        # Actually it matches the error from `pd.api.extensions.ExtensionArray` or validation?
        
        # Let's search specifically for this string in pandas source if we could.
        # But let's try sanitize_array
        pass
        
    except Exception as e:
        print(f"Caught: {e}")

if __name__ == "__main__":
    test_error()

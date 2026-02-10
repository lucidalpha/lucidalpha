
# Maps the generic "ticker" used in our app (e.g. 'GC=F') to the specific Root and Exchange Suffix for Term Structure
# Month Codes: F(Jan), G(Feb), H(Mar), J(Apr), K(May), M(Jun), N(Jul), Q(Aug), U(Sep), V(Oct), X(Nov), Z(Dec)

FUTURES_METADATA = {
    # Metals (COMEX / NYMEX)
    "GC=F": {"root": "GC", "exchange": ".CMX", "months": "G,J,M,Q,Z", "name": "Gold", "structure": "Normal: Contango (Lager + Zins)"},
    "SI=F": {"root": "SI", "exchange": ".CMX", "months": "H,K,N,U,Z", "name": "Silver", "structure": "Normal: Contango (Lager + Zins)"},
    "HG=F": {"root": "HG", "exchange": ".CMX", "months": "H,K,N,U,Z", "name": "Copper", "structure": "Normal: Contango (Lager + Zins)"},
    "PL=F": {"root": "PL", "exchange": ".NYM", "months": "F,J,N,V", "name": "Platinum", "structure": "Normal: Contango (Lager + Zins)"},
    "PA=F": {"root": "PA", "exchange": ".NYM", "months": "H,M,U,Z", "name": "Palladium", "structure": "Normal: Contango (Lager + Zins)"},

    # Energy (NYMEX)
    "CL=F": {"root": "CL", "exchange": ".NYM", "months": "F,G,H,J,K,M,N,Q,U,V,X,Z", "name": "Crude Oil", "structure": "Normal: Contango (Lagerkosten)"},
    "NG=F": {"root": "NG", "exchange": ".NYM", "months": "F,G,H,J,K,M,N,Q,U,V,X,Z", "name": "Natural Gas", "structure": "Normal: Contango (Saisonal)"},
    "RB=F": {"root": "RB", "exchange": ".NYM", "months": "F,G,H,J,K,M,N,Q,U,V,X,Z", "name": "Gasoline", "structure": "Normal: Contango (Saisonal)"}, 
    "HO=F": {"root": "HO", "exchange": ".NYM", "months": "F,G,H,J,K,M,N,Q,U,V,X,Z", "name": "Heating Oil", "structure": "Normal: Contango (Saisonal)"},

    # Grains (CBOT)
    "ZC=F": {"root": "ZC", "exchange": ".CBT", "months": "H,K,N,U,Z", "name": "Corn", "structure": "Normal: Contango (Lagerkosten)"},
    "ZW=F": {"root": "ZW", "exchange": ".CBT", "months": "H,K,N,U,Z", "name": "Wheat", "structure": "Normal: Contango (Lagerkosten)"},
    "ZS=F": {"root": "ZS", "exchange": ".CBT", "months": "F,H,K,N,Q,U,X", "name": "Soybeans", "structure": "Normal: Contango (Lagerkosten)"},
    "ZM=F": {"root": "ZM", "exchange": ".CBT", "months": "F,H,K,N,Q,U,Z", "name": "Soybean Meal", "structure": "Normal: Contango"},
    "ZL=F": {"root": "ZL", "exchange": ".CBT", "months": "F,H,K,N,Q,U,Z", "name": "Soybean Oil", "structure": "Normal: Contango"},
    "ZO=F": {"root": "ZO", "exchange": ".CBT", "months": "H,K,N,U,Z", "name": "Oats", "structure": "Normal: Contango"},
    
    # Softs (ICE US)
    "KC=F": {"root": "KC", "exchange": ".NYB", "months": "H,K,N,U,Z", "name": "Coffee", "structure": "Normal: Contango (Lagerkosten)"},
    "SB=F": {"root": "SB", "exchange": ".NYB", "months": "H,K,N,V", "name": "Sugar", "structure": "Normal: Contango (Lagerkosten)"},
    "CC=F": {"root": "CC", "exchange": ".NYB", "months": "H,K,N,U,Z", "name": "Cocoa", "structure": "Normal: Contango (Lagerkosten)"},
    "CT=F": {"root": "CT", "exchange": ".NYB", "months": "H,K,N,V,Z", "name": "Cotton", "structure": "Normal: Contango"},
    "OJ=F": {"root": "OJ", "exchange": ".NYB", "months": "F,H,K,N,U,X", "name": "Orange Juice", "structure": "Normal: Contango"},

    # Meats (CME) - Often have strong seasonal backwardation
    "LE=F": {"root": "LE", "exchange": ".CME", "months": "G,J,M,Q,V,Z", "name": "Live Cattle", "structure": "Variabel (Stark Saisonal)"},
    "GF=F": {"root": "GF", "exchange": ".CME", "months": "F,H,J,K,Q,U,V,X", "name": "Feeder Cattle", "structure": "Variabel (Stark Saisonal)"},
    "HE=F": {"root": "HE", "exchange": ".CME", "months": "G,J,K,M,N,Q,V,Z", "name": "Lean Hogs", "structure": "Variabel (Stark Saisonal)"},

    # Currencies (CME) - IRP
    "6E=F": {"root": "6E", "exchange": ".CME", "months": "H,M,U,Z", "name": "Euro", "structure": "Zinsdifferenz (IRP)"},
    "6A=F": {"root": "6A", "exchange": ".CME", "months": "H,M,U,Z", "name": "AUD", "structure": "Zinsdifferenz (IRP)"},
    "6B=F": {"root": "6B", "exchange": ".CME", "months": "H,M,U,Z", "name": "GBP", "structure": "Zinsdifferenz (IRP)"},
    "6C=F": {"root": "6C", "exchange": ".CME", "months": "H,M,U,Z", "name": "CAD", "structure": "Zinsdifferenz (IRP)"},
    "6J=F": {"root": "6J", "exchange": ".CME", "months": "H,M,U,Z", "name": "JPY", "structure": "Zinsdifferenz (IRP)"},
    "6S=F": {"root": "6S", "exchange": ".CME", "months": "H,M,U,Z", "name": "CHF", "structure": "Zinsdifferenz (IRP)"},
    "6N=F": {"root": "6N", "exchange": ".CME", "months": "H,M,U,Z", "name": "NZD", "structure": "Zinsdifferenz (IRP)"},
    "DX=F": {"root": "DX", "exchange": ".NYB", "months": "H,M,U,Z", "name": "Dollar Index", "structure": "Zinsdifferenz (IRP)"},

    # Indices (CME) - Cost of Carry (Interest - Divs)
    "ES=F": {"root": "ES", "exchange": ".CME", "months": "H,M,U,Z", "name": "S&P 500", "structure": "Normal: Contango (Zinsen > Dividende)"},
    "NQ=F": {"root": "NQ", "exchange": ".CME", "months": "H,M,U,Z", "name": "Nasdaq", "structure": "Normal: Contango (Zinsen > Dividende)"},
    "YM=F": {"root": "YM", "exchange": ".CBT", "months": "H,M,U,Z", "name": "Dow", "structure": "Normal: Contango (Zinsen > Dividende)"},
    "RTY=F": {"root": "RTY", "exchange": ".CME", "months": "H,M,U,Z", "name": "Russell", "structure": "Normal: Contango (Zinsen > Dividende)"},
    
    # Rates
    "ZB=F": {"root": "ZB", "exchange": ".CBT", "months": "H,M,U,Z", "name": "30Y Bond", "structure": "Variabel (Zinskurve)"}
}

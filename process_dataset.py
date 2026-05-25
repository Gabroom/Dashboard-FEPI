import csv
from datetime import datetime
import json
import os
import sys

csv_path = r"C:\Users\ASUS\Documents\Codes_Antigravity\Dashboard_FEPI\DataCoSupplyChainDataset.csv"
output_path = r"C:\Users\ASUS\Documents\Codes_Antigravity\Dashboard_FEPI\src\aggregated_dataset.json"

try:
    print("Reading CSV and checking Order Status values...")
    order_statuses = {}
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            status = row.get("Order Status")
            order_statuses[status] = order_statuses.get(status, 0) + 1
            if i > 100000 and len(order_statuses) > 10:
                break
    
    print("\nOrder Status counts (sample/full):")
    for k, v in order_statuses.items():
        print(f"  {k}: {v}")

    # Restart and run full aggregation
    print("\nStarting full aggregation...")
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f)
        
        # We will collect unique values
        regions_set = set()
        modes_set = set()
        categories_set = set()
        
        # We will map dates to year-month index
        # Min date is 2015-01, let's map year-month to a sequence index
        # E.g. 2015-01 -> 1, 2018-01 -> 37
        def get_month_index(date_str):
            if not date_str:
                return None
            try:
                # Format: 1/31/2018 22:56
                dt = datetime.strptime(date_str, "%m/%d/%Y %H:%M")
                val = (dt.year - 2015) * 12 + dt.month
                return val # 1-indexed relative to Jan 2015 (which is 1)
            except ValueError:
                return None

        # Helper to map month index to label
        MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        def get_month_label(m_idx):
            if m_idx is None:
                return ""
            year = 15 + (m_idx - 1) // 12
            month_name = MONTH_NAMES[(m_idx - 1) % 12]
            return f"{month_name} '{year}"

        aggregated = {}
        row_count = 0
        
        for row in reader:
            row_count += 1
            
            # Extract key fields
            reg = row.get("Order Region")
            mode = row.get("Shipping Mode")
            cat = row.get("Category Name")
            date_str = row.get("order date (DateOrders)")
            
            month_idx = get_month_index(date_str)
            if month_idx is None:
                continue
                
            regions_set.add(reg)
            modes_set.add(mode)
            categories_set.add(cat)
            
            # Map status
            del_status = row.get("Delivery Status")
            ord_status = row.get("Order Status")
            
            # Logic:
            # - Canceled: if Delivery Status is Shipping canceled or Order Status is CANCELED/SUSPECTED_FRAUD (canceled)
            # - Shipping (in transit): if Order Status is PENDING, PROCESSING, ON_HOLD, PENDING_PAYMENT, PAYMENT_REVIEW and Delivery Status is NOT Late delivery
            # - Late: if Delivery Status is Late delivery
            # - Advance: if Delivery Status is Advance shipping
            # - On Time: if Delivery Status is Shipping on time
            status = 'on_time'
            if del_status == 'Shipping canceled' or ord_status in ('CANCELED', 'SUSPECTED_FRAUD'):
                status = 'canceled'
            elif ord_status in ('PENDING', 'PROCESSING', 'ON_HOLD', 'PENDING_PAYMENT', 'PAYMENT_REVIEW') and del_status != 'Late delivery':
                status = 'shipping'
            elif del_status == 'Late delivery':
                status = 'late'
            elif del_status == 'Advance shipping':
                status = 'advance'
            elif del_status == 'Shipping on time':
                status = 'on_time'
                
            late_risk = 1 if row.get("Late_delivery_risk") == '1' else 0
            
            try:
                real = float(row.get("Days for shipping (real)", 0))
                sched = float(row.get("Days for shipment (scheduled)", 0))
            except ValueError:
                real = 0.0
                sched = 0.0
                
            # Aggregation key
            key = (reg, mode, cat, month_idx)
            if key not in aggregated:
                aggregated[key] = {
                    "count": 0,
                    "canceled": 0,
                    "late": 0,
                    "on_time": 0,
                    "advance": 0,
                    "shipping": 0,
                    "late_risk": 0,
                    "sum_real": 0.0,
                    "sum_sched": 0.0
                }
                
            agg = aggregated[key]
            agg["count"] += 1
            agg[status] += 1
            agg["late_risk"] += late_risk
            agg["sum_real"] += real
            agg["sum_sched"] += sched
            
            if row_count % 50000 == 0:
                print(f"Processed {row_count} rows...")
                
        # Format the final JSON output
        result_data = []
        for key, val in aggregated.items():
            reg, mode, cat, month_idx = key
            result_data.append({
                "reg": reg,
                "mode": mode,
                "cat": cat,
                "month": month_idx,
                "month_label": get_month_label(month_idx),
                "count": val["count"],
                "canceled": val["canceled"],
                "late": val["late"],
                "on_time": val["on_time"],
                "advance": val["advance"],
                "shipping": val["shipping"],
                "late_risk": val["late_risk"],
                "sum_real": round(val["sum_real"], 1),
                "sum_sched": round(val["sum_sched"], 1)
            })
            
        output_data = {
            "regions": sorted(list(regions_set)),
            "modes": sorted(list(modes_set)),
            "categories": sorted(list(categories_set)),
            "data": result_data
        }
        
        print(f"\nWriting aggregated data to {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as out_f:
            json.dump(output_data, out_f, ensure_ascii=False, indent=2)
            
        print(f"Successfully processed {row_count} rows and saved {len(result_data)} aggregated records.")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)

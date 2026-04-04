#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://sales-command-center-9.preview.emergentagent.com/api"

def test_admin_users_api():
    """Test Admin Users API endpoints"""
    print("\n=== Testing Admin Users API ===")
    
    # Test GET /api/admin/users without authentication
    print("1. Testing GET /api/admin/users without auth...")
    try:
        response = requests.get(f"{BASE_URL}/admin/users")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected")
            return True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_users_post():
    """Test Admin Users POST API"""
    print("\n2. Testing POST /api/admin/users without auth...")
    try:
        test_user_data = {
            "email": "testadmin@example.com",
            "password": "testpassword123",
            "full_name": "Test Admin User",
            "phone_number": "+1234567890",
            "designation": "Test Admin",
            "role": "admin"
        }
        
        response = requests.post(f"{BASE_URL}/admin/users", json=test_user_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected")
            return True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_stats_api():
    """Test Admin Stats API endpoint"""
    print("\n=== Testing Admin Stats API ===")
    
    print("1. Testing GET /api/admin/stats without auth...")
    try:
        response = requests.get(f"{BASE_URL}/admin/stats")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected")
            return True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_sales_calls_revisit_functionality():
    """Test Sales Calls API revisit functionality"""
    print("\n=== Testing Sales Calls Revisit Functionality ===")
    
    print("1. Testing POST /api/sales-calls without auth...")
    try:
        # Test data with revisit information
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        test_call_data = {
            "company_id": "test-company-id",
            "contact_id": "test-contact-id", 
            "call_date": datetime.now().strftime('%Y-%m-%d'),
            "call_time": "14:30:00",
            "call_outcome": "Interested",
            "call_notes": "Customer showed interest in our services",
            "revisit_date_given": tomorrow,
            "revisit_time_given": "10:00:00",
            "revisit_notes": "Follow up on pricing discussion"
        }
        
        response = requests.post(f"{BASE_URL}/sales-calls", json=test_call_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected (authentication required)")
            return True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_companies_api():
    """Test Companies API to verify it still works"""
    print("\n=== Testing Companies API ===")
    
    print("1. Testing GET /api/companies without auth...")
    try:
        response = requests.get(f"{BASE_URL}/companies")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected")
            companies_get_pass = True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            companies_get_pass = False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        companies_get_pass = False
    
    print("\n2. Testing POST /api/companies without auth...")
    try:
        test_company_data = {
            "company_name": "Test Company Ltd",
            "industry": "Technology",
            "account_tier": "Enterprise",
            "pipeline_stage": "Prospect",
            "address": "123 Test Street, Test City",
            "phone_number": "+1234567890",
            "email": "contact@testcompany.com"
        }
        
        response = requests.post(f"{BASE_URL}/companies", json=test_company_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ PASS: Returns 401 Unauthorized as expected")
            companies_post_pass = True
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            companies_post_pass = False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        companies_post_pass = False
    
    return companies_get_pass and companies_post_pass

def main():
    """Run all backend API tests"""
    print("🚀 Starting Backend API Tests for Admin Endpoints")
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    results = []
    
    # Test Admin Users API
    admin_users_get_result = test_admin_users_api()
    admin_users_post_result = test_admin_users_post()
    results.append(("Admin Users GET", admin_users_get_result))
    results.append(("Admin Users POST", admin_users_post_result))
    
    # Test Admin Stats API
    admin_stats_result = test_admin_stats_api()
    results.append(("Admin Stats GET", admin_stats_result))
    
    # Test Sales Calls revisit functionality
    sales_calls_result = test_sales_calls_revisit_functionality()
    results.append(("Sales Calls Revisit", sales_calls_result))
    
    # Test Companies API
    companies_result = test_companies_api()
    results.append(("Companies API", companies_result))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Admin API endpoints are properly secured.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
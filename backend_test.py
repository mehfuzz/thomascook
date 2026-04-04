#!/usr/bin/env python3
"""
Backend API Testing for Thomas Cook Sales Command Center
Tests all API endpoints for functionality and authentication
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://sales-command-center-9.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test GET /api - Health check endpoint"""
        try:
            response = self.session.get(f"{API_BASE}")
            
            if response.status_code == 200:
                data = response.json()
                if "Thomas Cook Sales Command Center API" in data.get('message', ''):
                    self.log_result("Health Check", True, "API health check successful")
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_profile_without_token(self):
        """Test GET /api/auth/profile without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/auth/profile")
            
            if response.status_code == 401:
                self.log_result("Auth Profile (No Token)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Auth Profile (No Token)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Auth Profile (No Token)", False, f"Request failed: {str(e)}")
            return False
    
    def test_companies_without_auth(self):
        """Test GET /api/companies without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/companies")
            
            if response.status_code == 401:
                self.log_result("Companies (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Companies (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Companies (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_companies_post_without_auth(self):
        """Test POST /api/companies without authentication - should return 401"""
        try:
            test_company = {
                "company_name": "Test Company",
                "city": "Test City",
                "account_tier": "Tier 1"
            }
            
            response = self.session.post(f"{API_BASE}/companies", json=test_company)
            
            if response.status_code == 401:
                self.log_result("Companies POST (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Companies POST (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Companies POST (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_sales_calls_without_auth(self):
        """Test GET /api/sales-calls without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/sales-calls")
            
            if response.status_code == 401:
                self.log_result("Sales Calls (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Sales Calls (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Sales Calls (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_sales_calls_post_without_auth(self):
        """Test POST /api/sales-calls without authentication - should return 401"""
        try:
            test_call = {
                "company_id": str(uuid.uuid4()),
                "call_date": "2025-01-15",
                "call_time": "10:00:00",
                "call_outcome": "Interested"
            }
            
            response = self.session.post(f"{API_BASE}/sales-calls", json=test_call)
            
            if response.status_code == 401:
                self.log_result("Sales Calls POST (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Sales Calls POST (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Sales Calls POST (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_without_auth(self):
        """Test GET /api/tasks without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/tasks")
            
            if response.status_code == 401:
                self.log_result("Tasks (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Tasks (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Tasks (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_post_without_auth(self):
        """Test POST /api/tasks without authentication - should return 401"""
        try:
            test_task = {
                "title": "Test Task",
                "description": "Test Description",
                "priority": "High",
                "status": "Pending"
            }
            
            response = self.session.post(f"{API_BASE}/tasks", json=test_task)
            
            if response.status_code == 401:
                self.log_result("Tasks POST (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Tasks POST (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Tasks POST (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_patch_without_auth(self):
        """Test PATCH /api/tasks/[id] without authentication - should return 401"""
        try:
            test_id = str(uuid.uuid4())
            test_update = {"status": "Completed"}
            
            response = self.session.patch(f"{API_BASE}/tasks/{test_id}", json=test_update)
            
            if response.status_code == 401:
                self.log_result("Tasks PATCH (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Tasks PATCH (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Tasks PATCH (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_appointments_without_auth(self):
        """Test GET /api/appointments without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/appointments")
            
            if response.status_code == 401:
                self.log_result("Appointments (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Appointments (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Appointments (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_appointments_post_without_auth(self):
        """Test POST /api/appointments without authentication - should return 401"""
        try:
            test_appointment = {
                "company_id": str(uuid.uuid4()),
                "appointment_date": "2025-01-20",
                "appointment_time": "14:00:00",
                "purpose": "Sales Meeting"
            }
            
            response = self.session.post(f"{API_BASE}/appointments", json=test_appointment)
            
            if response.status_code == 401:
                self.log_result("Appointments POST (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Appointments POST (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Appointments POST (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_proposals_without_auth(self):
        """Test GET /api/proposals without authentication - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/proposals")
            
            if response.status_code == 401:
                self.log_result("Proposals (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Proposals (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Proposals (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_proposals_post_without_auth(self):
        """Test POST /api/proposals without authentication - should return 401"""
        try:
            test_proposal = {
                "company_id": str(uuid.uuid4()),
                "title": "Test Proposal",
                "description": "Test proposal description",
                "status": "Draft"
            }
            
            response = self.session.post(f"{API_BASE}/proposals", json=test_proposal)
            
            if response.status_code == 401:
                self.log_result("Proposals POST (No Auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("Proposals POST (No Auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Proposals POST (No Auth)", False, f"Request failed: {str(e)}")
            return False
    
    def test_endpoint_structure(self):
        """Test that endpoints return proper JSON structure even on errors"""
        try:
            response = self.session.get(f"{API_BASE}/nonexistent")
            
            if response.status_code == 404:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result("Endpoint Structure", True, "404 endpoints return proper JSON error structure")
                        return True
                    else:
                        self.log_result("Endpoint Structure", False, "404 response missing error field", data)
                        return False
                except json.JSONDecodeError:
                    self.log_result("Endpoint Structure", False, "404 response not valid JSON", response.text)
                    return False
            else:
                self.log_result("Endpoint Structure", False, f"Expected 404, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Endpoint Structure", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("THOMAS COOK SALES COMMAND CENTER - BACKEND API TESTS")
        print("=" * 60)
        print(f"Testing API at: {API_BASE}")
        print()
        
        # Test health check (no auth required)
        self.test_health_check()
        print()
        
        # Test authentication requirements for all protected endpoints
        print("Testing Authentication Requirements:")
        print("-" * 40)
        self.test_auth_profile_without_token()
        self.test_companies_without_auth()
        self.test_companies_post_without_auth()
        self.test_sales_calls_without_auth()
        self.test_sales_calls_post_without_auth()
        self.test_tasks_without_auth()
        self.test_tasks_post_without_auth()
        self.test_tasks_patch_without_auth()
        self.test_appointments_without_auth()
        self.test_appointments_post_without_auth()
        self.test_proposals_without_auth()
        self.test_proposals_post_without_auth()
        print()
        
        # Test endpoint structure
        print("Testing Endpoint Structure:")
        print("-" * 40)
        self.test_endpoint_structure()
        print()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\nNote: Authentication tests verify that endpoints properly require")
        print("Supabase authentication. Actual functionality testing would require")
        print("valid authentication tokens.")
        
        return failed_tests == 0

def main():
    """Main test execution"""
    tester = APITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend API tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some backend API tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
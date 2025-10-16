// src/app/core/services/timesheet.service.ts
import { Injectable } from '@angular/core';
import API from 'aws-amplify';
import gql from 'graphql-tag';

interface Timesheet {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  entries: { id: string; date: string; hours: number; description: string; accountId: string }[];
  totalHours: number;
  totalCost: number;
  rejectionReason?: string;
}

interface Account {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  async createTimesheet(): Promise<string> {
    try {
      const mutation = gql`
        mutation CreateTimesheet($input: CreateTimesheetInput!) {
          createTimesheet(input: $input) {
            id
          }
        }
      `;
      const result = await API.graphql({
        query: mutation,
        variables: { input: { status: 'draft', totalHours: 0, totalCost: 0 } }
      }) as any;
      return result.data.createTimesheet.id;
    } catch (error) {
      console.error('Error creating timesheet:', error);
      throw error;
    }
  }

  async getTimesheets(status?: string): Promise<Timesheet[]> {
    try {
      const query = gql`
        query ListTimesheets($status: String) {
          listTimesheets(status: $status) {
            id
            status
            entries {
              id
              date
              hours
              description
              accountId
            }
            totalHours
            totalCost
            rejectionReason
          }
        }
      `;
      const result = await API.graphql({ query, variables: { status } }) as any;
      return result.data.listTimesheets;
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      throw error;
    }
  }

  async addEntry(entry: { date: string; hours: number; description: string; accountId: string; timesheetId: string }) {
    try {
      const mutation = gql`
        mutation AddTimesheetEntry($input: TimesheetEntryInput!) {
          addTimesheetEntry(input: $input) {
            id
            date
            hours
            description
            accountId
            timesheetId
          }
        }
      `;
      await API.graphql({ query: mutation, variables: { input: entry } });
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }

  async submitTimesheet(timesheetId: string) {
    try {
      const mutation = gql`
        mutation SubmitTimesheet($id: ID!) {
          submitTimesheet(id: $id) {
            id
            status
          }
        }
      `;
      await API.graphql({ query: mutation, variables: { id: timesheetId } });
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      throw error;
    }
  }

  async approveTimesheet(timesheetId: string, entries: any[]) {
    try {
      const mutation = gql`
        mutation ApproveTimesheet($id: ID!, $entries: [TimesheetEntryInput!]!) {
          approveTimesheet(id: $id, entries: $entries) {
            id
            status
          }
        }
      `;
      await API.graphql({ query: mutation, variables: { id: timesheetId, entries } });
    } catch (error) {
      console.error('Error approving timesheet:', error);
      throw error;
    }
  }

  async rejectTimesheet(timesheetId: string, rejectionReason: string) {
    try {
      const mutation = gql`
        mutation RejectTimesheet($id: ID!, $rejectionReason: String!) {
          rejectTimesheet(id: $id, rejectionReason: $rejectionReason) {
            id
            status
            rejectionReason
          }
        }
      `;
      await API.graphql({ query: mutation, variables: { id: timesheetId, rejectionReason } });
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      throw error;
    }
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const query = gql`
        query ListAccounts {
          listAccounts {
            id
            name
          }
        }
      `;
      const result = await API.graphql({ query }) as any;
      return result.data.listAccounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }
}
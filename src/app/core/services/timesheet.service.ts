// src/app/services/timesheet.service.ts
import { Injectable } from '@angular/core';
import { API } from 'aws-amplify';
import { gql } from '@aws-amplify/api';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  async getTimesheets(status?: string) {
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
  }

  async addEntry(entry: { date: string; hours: number; description: string; accountId: string; timesheetId: string }) {
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
  }

  async submitTimesheet(timesheetId: string) {
    const mutation = gql`
      mutation SubmitTimesheet($id: ID!) {
        submitTimesheet(id: $id) {
          id
          status
        }
      }
    `;
    await API.graphql({ query: mutation, variables: { id: timesheetId } });
  }

  async approveTimesheet(timesheetId: string, entries: any[]) {
    const mutation = gql`
      mutation ApproveTimesheet($id: ID!, $entries: [TimesheetEntryInput!]!) {
        approveTimesheet(id: $id, entries: $entries) {
          id
          status
        }
      }
    `;
    await API.graphql({ query: mutation, variables: { id: timesheetId, entries } });
  }

  async rejectTimesheet(timesheetId: string, rejectionReason: string) {
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
  }

  async getAccounts() {
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
  }
}

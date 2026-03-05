import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import { BookingsService } from './bookings.service';
import {
  AcceptCounterProposalDto,
  CancelBookingDto,
  ConfirmBookingDto,
  CounterProposalDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  RejectBookingDto
} from './dto/create-booking.dto';

@ApiTags('Booking')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBody({ type: CreateBookingDto })
  create(@Req() req: { user?: { sub: string } }, @Body() body: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user?.sub, body);
  }

  @Get('bookings/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('customer', 'business', 'admin')
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  myBookings(@Req() req: { user: { sub: string } }, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.listMine(req.user.sub, query.country);
  }

  @Get('business/:id/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  byBusiness(@Param('id') businessId: string, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.listByBusiness(businessId, query.country);
  }

  @Patch('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('customer', 'business', 'admin')
  @ApiParam({ name: 'id', example: 'booking_123' })
  @ApiBody({ type: CancelBookingDto })
  cancel(@Param('id') bookingId: string, @Body() body: CancelBookingDto) {
    return this.bookingsService.cancel(bookingId, body);
  }

  @Patch('bookings/:id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'booking_123' })
  @ApiBody({ type: ConfirmBookingDto })
  @ApiOkResponse({ description: 'Confirm booking (business)' })
  confirm(@Param('id') bookingId: string, @Body() body: ConfirmBookingDto) {
    return this.bookingsService.confirm(bookingId, body);
  }

  @Patch('bookings/:id/counter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'booking_123' })
  @ApiBody({ type: CounterProposalDto })
  @ApiOkResponse({ description: 'Counter propose booking time (business)' })
  counter(@Param('id') bookingId: string, @Body() body: CounterProposalDto) {
    return this.bookingsService.proposeCounter(bookingId, body);
  }

  @Patch('bookings/:id/accept-counter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('customer', 'business', 'admin')
  @ApiParam({ name: 'id', example: 'booking_123' })
  @ApiBody({ type: AcceptCounterProposalDto })
  @ApiOkResponse({ description: 'Accept counter proposal' })
  acceptCounter(@Param('id') bookingId: string, @Body() body: AcceptCounterProposalDto) {
    return this.bookingsService.acceptCounter(bookingId, body);
  }

  @Patch('bookings/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'booking_123' })
  @ApiBody({ type: RejectBookingDto })
  @ApiOkResponse({ description: 'Reject booking request' })
  reject(@Param('id') bookingId: string, @Body() body: RejectBookingDto) {
    return this.bookingsService.reject(bookingId, body);
  }
}
